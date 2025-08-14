// app/api/detection/detection-logic.js
// === Environment Variables ===
const HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_PROMPT = process.env.LLM_PROMPT;

if (!HF_ACCESS_TOKEN || !LLM_API_KEY) {
    throw new Error("Missing HF_ACCESS_TOKEN or LLM_API_KEY in environment variables.");
}

// === Model Configuration ===
const MODELS = {
    zeroShot: {
        id: 'facebook/bart-large-mnli',
        endpoint: 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
    },
    sarcasm: {
        id: 'helinivan/multilingual-sarcasm-detector',
        endpoint: 'https://api-inference.huggingface.co/models/helinivan/multilingual-sarcasm-detector',
        maxLength: 2000,
    },
    politicalBias: {
        id: 'bucketresearch/politicalBiasBERT',
        endpoint: 'https://api-inference.huggingface.co/models/bucketresearch/politicalBiasBERT',
        maxLength: 500,
    },
};

const LLM_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';

// === Helper Functions ===
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function sanitizeText(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

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

// === Model Detection Functions ===
async function detectSarcasm(text) {
    const truncated = text.slice(0, MODELS.sarcasm.maxLength);
    const result = await safeFetchWithRetry(MODELS.sarcasm.endpoint, {
        headers: {
            Authorization: `Bearer ${HF_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ inputs: truncated }),
    });

    const sarcasmPrediction = result[0]?.find((item) => item.label === 'LABEL_1');
    const score = sarcasmPrediction ? sarcasmPrediction.score : 0;
    return { raw: result, score };
}

async function classifyZeroShot(text, labels) {
    return await safeFetchWithRetry(MODELS.zeroShot.endpoint, {
        headers: {
            Authorization: `Bearer ${HF_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
            inputs: text,
            parameters: { candidate_labels: labels, multi_label: true },
        }),
    });
}

async function detectPoliticalBias(text) {
    const truncated = text.slice(0, MODELS.politicalBias.maxLength);
    return await safeFetchWithRetry(MODELS.politicalBias.endpoint, {
        headers: {
            Authorization: `Bearer ${HF_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ inputs: truncated }),
    });
}

async function synthesizeWithLLM(text, zeroShot, sarcasm, politicalBias, currentDate) {
    const prompt = LLM_PROMPT
        .replace('${currentDate}', currentDate)
        .replace('${text}', text)
        .replace('${JSON.stringify(zeroShot, null, 2)}', JSON.stringify(zeroShot, null, 2))
        .replace('${JSON.stringify(sarcasm.raw, null, 2)}', JSON.stringify(sarcasm.raw, null, 2))
        .replace('${JSON.stringify(politicalBias, null, 2)}', JSON.stringify(politicalBias, null, 2));

    const result = await safeFetchWithRetry(LLM_ENDPOINT, {
        headers: {
            'x-goog-api-key': LLM_API_KEY,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    });

    const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
        return { error: "Synthesis unavailable" };
    }

    try {
        const jsonMatch = responseText.match(/```json\n([\s\S]*)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : responseText;
        return JSON.parse(jsonString);
    } catch (err) {
        console.error(`[LLM JSON Parse Error] ${err.message}`);
        return { error: "Synthesis unavailable", rawResponse: responseText };
    }
}

// === Main Detection Function ===
export async function detectContent(text, labelGroup) {
    // Input validation
    if (typeof text !== 'string' || text.trim().length === 0) {
        throw new Error("Invalid or missing 'text'.");
    }
    if (!Array.isArray(labelGroup) || labelGroup.length === 0) {
        throw new Error("Invalid or missing 'labelGroup'.");
    }

    // Input sanitization
    const sanitizedText = sanitizeText(text);

    // Run all model detections in parallel
    const [sarcasmResult, zeroShotResult, politicalBiasResult] = await Promise.allSettled([
        detectSarcasm(sanitizedText),
        classifyZeroShot(sanitizedText, labelGroup),
        detectPoliticalBias(sanitizedText),
    ]);

    // Helper function to extract results
    const getResultOrNull = (promiseResult) =>
        promiseResult.status === 'fulfilled' ? promiseResult.value : null;

    const finalSarcasm = getResultOrNull(sarcasmResult);
    const finalZeroShot = getResultOrNull(zeroShotResult);
    const finalPoliticalBias = getResultOrNull(politicalBiasResult);

    // Get current date
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Synthesize results
    let finalLLMResult;
    if (finalSarcasm && finalZeroShot && finalPoliticalBias) {
        finalLLMResult = await synthesizeWithLLM(sanitizedText, finalZeroShot, finalSarcasm, finalPoliticalBias, currentDate);
    } else {
        finalLLMResult = {
            error: "One or more detection models failed.",
            details: {
                sarcasm: sarcasmResult.reason?.message,
                zeroShot: zeroShotResult.reason?.message,
                politicalBias: politicalBiasResult.reason?.message
            }
        };
    }

    // Return combined result
    const finalResult = {
        synthesis: finalLLMResult,
        zeroShotAnalysis: finalZeroShot,
        sarcasmAnalysis: finalSarcasm?.raw,
        politicalBiasAnalysis: finalPoliticalBias,
    };

    return finalResult;
}