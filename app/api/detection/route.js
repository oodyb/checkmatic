// app/api/detection/route.js
import { NextResponse } from 'next/server';

// === Environment Variables ===
const HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;
const LLM_API_KEY = process.env.LLM_API_KEY;

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

// === Utility: Safe Input & Delay ===
/**
 * Creates a promise that resolves after a specified time.
 * @param {number} ms - The delay in milliseconds.
 * @returns {Promise<void>} A promise that resolves after the delay.
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sanitizes text to prevent injection attacks before it's sent to models.
 * @param {string} text - The input text to sanitize.
 * @returns {string} The sanitized text.
 */
function sanitizeText(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

/**
 * Executes a fetch request with exponential backoff for rate limit handling.
 * @param {string} url - The URL to fetch.
 * @param {object} options - The fetch options.
 * @param {number} [retries=3] - The number of retry attempts.
 * @returns {Promise<any>} The parsed JSON response.
 */
async function safeFetchWithRetry(url, options, retries = 3) {
    let attempt = 0;
    while (attempt < retries) {
        try {
            const res = await fetch(url, options);

            if (res.ok) {
                return await res.json();
            }

            // Handle rate limiting (HTTP 429) with exponential backoff
            if (res.status === 429 && attempt < retries - 1) {
                const delay = Math.pow(2, attempt) * 1000;
                console.warn(`[Rate Limit] Retrying in ${delay}ms...`);
                await wait(delay);
                attempt++;
                continue;
            }

            // Throw error for other failed status codes
            throw new Error(`API error ${res.status}: ${res.statusText}`);
        } catch (error) {
            console.error(`[Fetch Error] Attempt ${attempt + 1}: ${error.message}`);
            if (attempt === retries - 1) throw error; // Re-throw on final attempt
            await wait(Math.pow(2, attempt) * 1000);
            attempt++;
        }
    }
}

// === Model Calls ===
/**
 * Detects sarcasm in the provided text using the sarcasm model.
 * @param {string} text - The input text.
 * @returns {Promise<{raw: any, score: number}>} The model's raw output and the sarcasm score.
 */
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

/**
 * Classifies text using the zero-shot model with given labels.
 * @param {string} text - The input text.
 * @param {string[]} labels - An array of candidate labels.
 * @returns {Promise<any>} The model's classification result.
 */
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

/**
 * Detects political bias in the provided text.
 * @param {string} text - The input text.
 * @returns {Promise<any>} The model's political bias detection result.
 */
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

/**
 * Synthesizes model outputs into a structured JSON response using an LLM.
 * @param {string} text - The original article text.
 * @param {any} zeroShot - The zero-shot model output.
 * @param {{raw: any, score: number}} sarcasm - The sarcasm model output.
 * @param {any} politicalBias - The political bias model output.
 * @param {string} currentDate - The current date as a formatted string.
 * @returns {Promise<any>} The parsed JSON from the LLM.
 */
async function synthesizeWithLLM(text, zeroShot, sarcasm, politicalBias, currentDate) {
    const prompt = `
You are "CheckMatic," a news analyst.
Your task is to analyze the provided article text and model outputs to produce a comprehensive, structured analysis.

## Instructions:
1.  **The current date is: ${currentDate}**
2.  **Strictly adhere to the JSON output format provided below.** Do not include any text before or after the JSON.
3.  Do not mention model names, rules, thresholds, or API endpoints in your response.
4.  For each classification, select a relevant quote from the article that supports your conclusion.
5.  For each classification, provide an "llm_reason" and an "llm_confidence" score (0.0 - 1.0) from your own analysis.
6.  If your analysis extremely disagrees with the models, explicitly state the reason for the discrepancy in the 'llm_reason' field.
7.  Set "llm_positive" to "true" if your reason agrees with any of the models' top labels, and "false" if it disagrees.
8.  "llm_reason" should be a concise reasoning, not a direct quote from the article. It should be used to justify models' scores.
9.  Use the provided models' scores to inform your analysis and confidence levels. You can only disagree if you have an extremely strong reason.
10. In "llm_reason", express models' confidence as a percentage (0% - 100%) and pair it with the corresponding label.
11. Do not use first-person pronouns ('I', 'my', 'we', 'our') or refer to yourself except as 'CheckMatic'. Avoid phrases like 'in my opinion' or 'I think'.
12. Do not add any Markdown formatting, asterisks (*), underscores (_), or other symbols for emphasis. Only quote text from the article directly.
13. If Sarcasm score is above 0.5, the use it as your own confidence level for the primary classification.
14. Do not mention the literal name of labels. For example, mention "LABEL_1" as "sarcasm".
15. The reason should be a concise, interpretive justification for the classification, not just a summary of the model's scores.

### Article Text:
${text}

### Model Outputs:
1.  **Credibility & Content Type Analysis**: ${JSON.stringify(zeroShot, null, 2)}
2.  **Sarcasm Detection**: ${JSON.stringify(sarcasm.raw, null, 2)}
3.  **Political Bias**: ${JSON.stringify(politicalBias, null, 2)}

## Output Format:
{
  "summary": "[A single, neutral sentence summary]",
  "primary_classification": {
    "type": "[string... choose one: 'authentic', 'fake', or 'satirical']",
    "quote": "[a quote from the article]",
    "model_confidence": [float],
    "llm_confidence": [float... 0.0-1.0],
    "llm_reason": "[string]",
    "llm_positive": [boolean]
  },
  "secondary_classification": {
    "type": "[string... choose or create one: 'news report', 'opinion', 'satire', 'misleading', 'analysis', etc.]",
    "quote": "[a quote from the article]",
    "model_confidence": [float],
    "llm_confidence": [float... 0.0-1.0],
    "llm_reason": "[string]",
    "llm_positive": [boolean]
  },
  "tertiary_classification": {
    "type": "[string: 'left_leaning', 'right_leaning', or 'neutral']",
    "quote": "[a quote from the article]",
    "model_confidence": [float],
    "llm_confidence": [float... 0.0-1.0],
    "llm_reason": "[string]",
    "llm_positive": [boolean]
  }
}
`;

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
        // The LLM may sometimes wrap the JSON in a code block, so we handle both cases.
        const jsonMatch = responseText.match(/```json\n([\s\S]*)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : responseText;
        return JSON.parse(jsonString);
    } catch (err) {
        console.error(`[LLM JSON Parse Error] ${err.message}`);
        return { error: "Synthesis unavailable", rawResponse: responseText };
    }
}

// === POST Handler ===
export async function POST(request) {
    try {
        console.log("=== Incoming Detection Request ===");

        const { text, labelGroup } = await request.json();

        // 1. Input Validation
        if (typeof text !== 'string' || text.trim().length === 0) {
            return NextResponse.json({ error: "Invalid or missing 'text'." }, { status: 400 });
        }
        if (!Array.isArray(labelGroup) || labelGroup.length === 0) {
            return NextResponse.json({ error: "Invalid or missing 'labelGroup'." }, { status: 400 });
        }

        // 2. Input Sanitization
        const sanitizedText = sanitizeText(text);

        // 3. Log initial request details
        console.log(`[Request] Text (first 80 chars): "${sanitizedText.slice(0, 80)}..."`);
        console.log(`[Request] Labels: ${labelGroup.join(', ')}`);

        // 4. Run all model detections in parallel for efficiency.
        const [sarcasmResult, zeroShotResult, politicalBiasResult] = await Promise.allSettled([
            detectSarcasm(sanitizedText),
            classifyZeroShot(sanitizedText, labelGroup),
            detectPoliticalBias(sanitizedText),
        ]);

        // Helper function to extract a fulfilled promise value or null on rejection.
        const getResultOrNull = (promiseResult) =>
            promiseResult.status === 'fulfilled' ? promiseResult.value : null;

        const finalSarcasm = getResultOrNull(sarcasmResult);
        const finalZeroShot = getResultOrNull(zeroShotResult);
        const finalPoliticalBias = getResultOrNull(politicalBiasResult);

        // 5. Get and format the current date
        const currentDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        // 6. Synthesize the results using the LLM.
        let finalLLMResult;
        if (finalSarcasm && finalZeroShot && finalPoliticalBias) {
            finalLLMResult = await synthesizeWithLLM(sanitizedText, finalZeroShot, finalSarcasm, finalPoliticalBias, currentDate);
        } else {
            // If any model failed, provide a structured error response.
            finalLLMResult = {
                error: "One or more detection models failed.", details: {
                    sarcasm: sarcasmResult.reason?.message,
                    zeroShot: zeroShotResult.reason?.message,
                    politicalBias: politicalBiasResult.reason?.message
                }
            };
        }

        // 7. Combine and log the final result.
        const finalResult = {
            synthesis: finalLLMResult,
            zeroShotAnalysis: finalZeroShot,
            sarcasmAnalysis: finalSarcasm?.raw,
            politicalBiasAnalysis: finalPoliticalBias,
        };

        console.log("\n--- Detection Complete ---");
        console.log(`[LLM Prompt] Date: ${currentDate}`);
        // Log the prompt without the full article text for brevity
        console.log(`[LLM Prompt] Models: ${JSON.stringify({ zeroShot: !!finalZeroShot, sarcasm: !!finalSarcasm, politicalBias: !!finalPoliticalBias })}`);
        console.log(`[LLM Raw Response] ${JSON.stringify(finalLLMResult, null, 2)}`);
        console.log("\n--- Final Combined Result ---");
        console.log(JSON.stringify(finalResult, null, 2));
        console.log("-----------------------------\n");


        console.log("=== Detection Complete ===");
        return NextResponse.json(finalResult);

    } catch (error) {
        console.error(`[API Fatal Error] ${error.stack}`);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}