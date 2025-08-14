// app/api/contact/route.js
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import { Redis } from '@upstash/redis';

// Initialize JSDOM and DOMPurify for server-side HTML sanitization
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize the Redis client with environment variables
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Rate limiting constants
const MAX_REQUESTS_PER_HOUR = 5;
const WINDOW_SECONDS = 60 * 60; // 1 hour

export async function POST(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(/, /)[0] : 'unknown';

    try {

        // --- RATE LIMITING LOGIC (REDIS) ---
        // Create a unique key for the user's IP
        const key = `rate-limit:${ip}`;

        // Get the current count for this key, or initialize to 0
        const requestCount = await redis.incr(key);

        // If this is the first request in the window, set the key to expire in one hour
        if (requestCount === 1) {
            await redis.expire(key, WINDOW_SECONDS);
        }

        // Check if the user has exceeded the request limit
        if (requestCount > MAX_REQUESTS_PER_HOUR) {
            return NextResponse.json(
                { message: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }
        const { name, email, message } = await request.json();

        // Check for required fields
        if (!name || !email || !message) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Eemail format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
        }

        // Prevent email header and HTML injection
        const sanitizedName = name.replace(/[\n\r]/g, '');
        const sanitizedEmail = email.replace(/[\n\r]/g, '');

        // Use DOMPurify for robust HTML sanitization of the message content
        const sanitizedMessage = DOMPurify.sanitize(message);

        // Ensure inputs are not empty after sanitization
        if (!sanitizedName.trim() || !sanitizedEmail.trim() || !sanitizedMessage.trim()) {
            return NextResponse.json({ message: 'Sanitized input cannot be empty' }, { status: 400 });
        }

        // Use an environment variable for the recipient email
        const recipientEmail = process.env.RESEND_CONTACT_EMAIL;
        if (!recipientEmail) {
            console.error('RESEND_CONTACT_EMAIL is not set in environment variables.');
            return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
        }

        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: recipientEmail,
            subject: `CheckMatic email | ${sanitizedName}`,
            html: `<p><strong>Name:</strong> ${sanitizedName}</p><p><strong>Email:</strong> ${sanitizedEmail}</p><p><strong>Message:</strong> ${sanitizedMessage}</p>`,
        });

        return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
    } catch (error) {
        console.error('Failed to send email:', error);
        return NextResponse.json({ message: 'Failed to send email' }, { status: 500 });
    }
}