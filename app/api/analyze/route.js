// app/api/analyze/route.js
import { NextResponse } from 'next/server';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import * as ipaddr from 'ipaddr.js';
import createDOMPurify from 'dompurify';
import * as cheerio from 'cheerio';

// Initialize DOMPurify for robust HTML sanitization
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// === Environment Variables ===
const GEMINI_API_KEY = process.env.LLM_API_KEY;
// Security: Use an environment variable for the internal API URL
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://localhost:3000/api/detection';

if (!GEMINI_API_KEY) {
    throw new Error("Missing LLM_API_KEY in environment variables.");
}

const LLM_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';

// --- HELPER FUNCTIONS FOR SECURITY AND RESPONSES ---

/**
 * Creates a standardized error response.
 * @param {string} message - The error message.
 * @param {number} status - The HTTP status code.
 * @returns {NextResponse}
 */
function createErrorResponse(message, status) {
    return NextResponse.json(
        { error: message },
        { status }
    );
}

// === Utility: Safe Fetch with Retry ===
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function safeFetchWithRetry(url, options, retries = 3) {
    let attempt = 0;
    while (attempt < retries) {
        try {
            const res = await fetch(url, options);

            if (res.ok) {
                return await res.json();
            }

            if (res.status === 429 && attempt < retries - 1) {
                const delay = Math.pow(2, attempt) * 1000;
                console.warn(`[Rate Limit] Retrying in ${delay}ms...`);
                await wait(delay);
                attempt++;
                continue;
            }

            throw new Error(`API error ${res.status}: ${res.statusText}`);
        } catch (error) {
            console.error(`[Fetch Error] Attempt ${attempt + 1}: ${error.message}`);
            if (attempt === retries - 1) throw error;
            await wait(Math.pow(2, attempt) * 1000);
            attempt++;
        }
    }
}


/**
 * Sanitizes text content using DOMPurify and checks for injection patterns.
 * @param {string} text - The input text to sanitize.
 * @returns {string} The sanitized text.
 */
function sanitizeText(text, skipInjectionCheck = false) {
    if (typeof text !== 'string') {
        throw new Error('Input must be a string');
    }

    const sanitized = DOMPurify.sanitize(text, { USE_PROFILES: { html: false } });
    const trimmed = sanitized.trim();

    if (trimmed.length > 50000) {
        throw new Error('Text content too large (maximum 50KB allowed)');
    }

    if (!skipInjectionCheck) {
        const injectionPatterns = [
            /(\b(union|select|insert|update|delete|drop|exec|execute|declare|alter)\b)/gi,
            /\b(eval|setTimeout|setInterval)\b/gi,
            /(^|\s)(javascript|data|vbscript):/gi,
        ];

        for (const pattern of injectionPatterns) {
            if (pattern.test(sanitized)) {
                throw new Error('Potentially malicious content detected');
            }
        }
    }

    return trimmed;
}

/**
 * Validates a URL for format, protocol, length, and SSRF risks.
 * @param {string} url - The URL to validate.
 * @returns {string} The validated and trimmed URL.
 */
function validateURL(url) {
    if (!url || typeof url !== 'string') {
        throw new Error('URL is required and must be a string');
    }

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
        throw new Error('URL cannot be empty');
    }

    // Basic format and protocol checks
    let parsedUrl;
    try {
        parsedUrl = new URL(trimmedUrl);
    } catch (error) {
        throw new Error('Invalid URL format');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are allowed');
    }

    if (trimmedUrl.length > 2048) {
        throw new Error('URL too long (maximum 2048 characters allowed)');
    }

    // Check for suspicious URL patterns
    const suspiciousPatterns = [
        /javascript:/gi,
        /data:/gi,
        /file:/gi,
        /ftp:/gi,
        /<script/gi,
        /(?:\/|^)\.\.(?:\/|$)/g
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(trimmedUrl)) {
            throw new Error('URL contains potentially malicious content');
        }
    }

    // SSRF protection: check for private/local IP addresses using ipaddr.js
    const hostname = parsedUrl.hostname;

    // Check for common local/suspicious hostnames first
    const suspiciousHostnames = [
        'localhost',
        '0.0.0.0',
        '::1',
        'ip6-localhost',
        'ip6-loopback',
        'broadcasthost'
    ];
    if (suspiciousHostnames.includes(hostname.toLowerCase())) {
        throw new Error('Access to private/local URLs is not allowed');
    }

    // Check if the hostname is a valid IP and if it's private/loopback/special
    if (ipaddr.isValid(hostname)) {
        const addr = ipaddr.parse(hostname);
        if (addr.isPrivate() || addr.isLoopback() || addr.isLinkLocal() || addr.isBroadcast()) {
            throw new Error('Access to private/local URLs is not allowed');
        }

        // Additional IPv6 checks for special ranges
        if (addr.kind() === 'ipv6') {
            const ipv6String = addr.toString();
            // Check for other IPv6 special ranges
            if (ipv6String.startsWith('ff') || // Multicast
                ipv6String.startsWith('fe80:') || // Link-local (redundant but explicit)
                ipv6String.startsWith('fc') || // Unique local
                ipv6String.startsWith('fd')) { // Unique local
                throw new Error('Access to private/local URLs is not allowed');
            }
        }
    }

    return trimmedUrl;
}

/**
 * Validates photo data, including size, type, and filename for security.
 * @param {object} photoData - The photo data object.
 * @returns {object} The validated photo data.
 */
function validatePhoto(photoData) {
    if (!photoData || typeof photoData !== 'object') {
        throw new Error('Photo data is required');
    }

    const { data, name, size, type } = photoData;

    if (!data || !name || typeof size !== 'number' || !type) {
        throw new Error('Photo data is incomplete or invalid');
    }

    // Enforce size limit (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (size > maxSize) {
        throw new Error('Photo size too large (maximum 10MB allowed)');
    }

    if (size <= 0) {
        throw new Error('Invalid photo size');
    }

    // Validate file type against a whitelist (removed SVG for security)
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp'
    ];
    if (!allowedTypes.includes(type.toLowerCase())) {
        throw new Error('Unsupported file type. Only JPEG, PNG, GIF, WebP, and BMP are allowed');
    }

    // Validate filename for malicious patterns
    const suspiciousPatterns = [
        /\.\./g, // Path traversal
        /<script/gi, // Script tags
        /javascript:/gi, // JavaScript protocol
        /\.exe$|\.bat$|\.cmd$|\.scr$|\.com$|\.pif$/gi, // Executable extensions
        /\.php$|\.asp$|\.jsp$|\.py$/gi // Server-side script extensions
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(name))) {
        throw new Error('Photo name contains potentially malicious content');
    }

    if (name.length > 255) {
        throw new Error('Photo name too long (maximum 255 characters allowed)');
    }

    if (name.length === 0) {
        throw new Error('Photo name cannot be empty');
    }

    // Validate base64 data format more strictly
    if (!data.startsWith('data:image/') || !data.includes('base64,')) {
        throw new Error('Invalid photo data format - must be base64 encoded image');
    }

    // Check for reasonable base64 length (shouldn't be tiny or malformed)
    const base64Data = data.split('base64,')[1];
    if (!base64Data || base64Data.length < 100) {
        throw new Error('Invalid or corrupted photo data');
    }

    return photoData;
}

// --- FUNCTION FOR CONTENT EXTRACTION ---
async function extract(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });
        if (!response.ok) {
            console.error(`[Extraction Error] Request failed with error code ${response.status}`);
            throw new Error(`Request failed with error code ${response.status}`);
        }
        const text = await response.text();

        // Use Readability for a structured article, but fall back to cheerio
        const dom = new JSDOM(text, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        // Fallback to cheerio if readability fails
        if (!article || !article.textContent) {
            console.warn('[Extraction] Readability failed, falling back to cheerio...');
            const $ = cheerio.load(text);
            const title = $('title').text();
            const content = $('p').map((i, el) => $(el).text()).get().join('\n');
            return { title, content };
        }

        return {
            title: article.title,
            content: article.textContent,
        };
    } catch (error) {
        console.error(`[Extraction Error] ${error.message}`);
        throw error;
    }
}

// --- SHARED FUNCTION TO CALL DETECTION API ---
async function callDetectionAPI(sanitizedContent) {
    const labelGroup = [
        "authentic", "fabricated", "misinformation", "report", "opinion", "analysis", "advertisement", "sponsored",
        "blog", "press_release", "interview", "extreme", "emotional", "clickbait", "conspiracy", "scam",
    ];

    try {
        // Security & Best Practice: Use environment variable for internal API endpoint
        const response = await fetch(INTERNAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: sanitizedContent,
                labelGroup: labelGroup,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Detection API Error:', errorData);
            throw new Error(`Detection API failed with status ${response.status}: ${errorData.error || 'Unknown error'}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Error during detection API call:', error);
        throw new Error(`Internal Server Error while analyzing content: ${error.message}`);
    }
}

/**
 * NEW FUNCTION: Handles image-to-text extraction using the Gemini LLM endpoint directly.
 */
async function detectTextFromImage(imageData) {
    try {
        const body = {
            contents: [{
                parts: [{
                    text: 'Transcribe the text in this image. Do not add any other text. Reply with the text from the image only.',
                }, {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: imageData.split('base64,')[1],
                    },
                },],
            },],
        };
        const urlWithKey = `${LLM_ENDPOINT}?key=${GEMINI_API_KEY}`;
        const result = await safeFetchWithRetry(urlWithKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!result || !result.candidates || !result.candidates[0].content.parts[0].text) {
            throw new Error('Invalid response from the Gemini API.');
        }

        return result.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error(`[Gemini Pro Vision Error] ${error.message}`);
        throw new Error("Failed to extract text from image.");
    }
}

// --- HANDLERS FOR EACH MODE ---

/**
 * Handles 'link' mode by extracting, sanitizing, and analyzing content from a URL.
 */
async function handleLinkMode(query) {
    if (!query) {
        return createErrorResponse('URL is required for link mode', 400);
    }

    const validatedUrl = validateURL(query);
    const extracted = await extract(validatedUrl);

    if (!extracted?.content) {
        return createErrorResponse(
            'Could not extract article content from the provided URL. Please check if the URL is accessible and contains readable content.',
            400
        );
    }

    const sanitizedContent = sanitizeText(extracted.content, true);
    if (!sanitizedContent) {
        return createErrorResponse('Text content cannot be empty after sanitization', 400);
    }

    const combinedResults = await callDetectionAPI(sanitizedContent);
    return NextResponse.json(combinedResults, { status: 200 });
}

/**
 * Handles 'text' mode by sanitizing and analyzing raw text content.
 */
async function handleTextMode(content) {
    if (!content) {
        return createErrorResponse('Text content is required for text mode', 400);
    }

    const sanitizedContent = sanitizeText(content, false);
    if (!sanitizedContent) {
        return createErrorResponse('Text content cannot be empty after sanitization', 400);
    }

    const combinedResults = await callDetectionAPI(sanitizedContent);
    return NextResponse.json(combinedResults, { status: 200 });
}

/**
 * Handles 'photo' mode by validating the provided photo data, extracting text, and then analyzing it.
 */
async function handlePhotoMode(photo) {
    if (!photo) {
        return createErrorResponse('Photo is required for photo mode', 400);
    }

    validatePhoto(photo);
    const extractedText = await detectTextFromImage(photo.data);

    if (!extractedText) {
        return createErrorResponse(
            'Could not extract text from the provided photo. Please ensure the image contains clear, readable text.',
            400
        );
    }
    const sanitizedContent = sanitizeText(extractedText, true);

    const combinedResults = await callDetectionAPI(sanitizedContent);
    return NextResponse.json(combinedResults, { status: 200 });
}

// --- MAIN API ROUTE HANDLER ---

export async function POST(request) {
    try {
        let requestData;
        try {
            requestData = await request.json();
        } catch (jsonError) {
            return createErrorResponse('Invalid JSON in request body', 400);
        }

        const { mode, query, content, photo } = requestData;

        if (!mode || typeof mode !== 'string') {
            return createErrorResponse('Mode parameter is required and must be a string', 400);
        }

        const validModes = ['link', 'text', 'photo'];
        if (!validModes.includes(mode)) {
            return createErrorResponse('Invalid mode. Must be one of: link, text, photo', 400);
        }

        switch (mode) {
            case 'link':
                return await handleLinkMode(query);
            case 'text':
                return await handleTextMode(content);
            case 'photo':
                return await handlePhotoMode(photo);
            default:
                // This case is technically unreachable due to the check above, but it's good practice.
                return createErrorResponse('Invalid mode. Must be one of: link, text, photo', 400);
        }

    } catch (error) {
        console.error("API analysis error:", error);

        // Security: Return a generic error message for the client to prevent internal information leakage.
        // The original error message is still logged on the server side for debugging.
        // Only return specific messages for controlled validation errors.
        if (error.message && (error.message.includes('URL is required') ||
            error.message.includes('Invalid URL format') ||
            error.message.includes('URL too long') ||
            error.message.includes('Access to private/local URLs') ||
            error.message.includes('Could not extract article content') ||
            error.message.includes('Text content is required') ||
            error.message.includes('Text content too large') ||
            error.message.includes('Potentially malicious content detected') ||
            error.message.includes('Failed to fetch content') ||
            error.message.includes('Photo size too large') ||
            error.message.includes('Unsupported file type') ||
            error.message.includes('Photo name contains potentially malicious content') ||
            error.message.includes('Failed to extract text from image') ||
            error.message.includes('Invalid or corrupted photo data'))) {
            return createErrorResponse(error.message, 400);
        }

        // Generic fallback for any other unexpected errors
        return createErrorResponse('An unexpected error occurred while processing your request.', 500);
    }
}
