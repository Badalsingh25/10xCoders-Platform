const { GoogleGenerativeAI } = require("@google/generative-ai");

// Centralized AI Logic with Retry & Fallback
const generateContentWithFallback = async (prompt, systemInstruction = "") => {
    // Models to try in order of preference/cost
    // Note: 'gemini-2.0-flash' is the primary, but we fallback to 1.5 variants if rate limited
    // Models to try in order of preference/cost
    // Updated based on available models for this API key:
    // Prioritize high intelligence models (Gemini 1.5 Pro / "Gemini 3 Pro" equivalent capability)
    // Then fallback to 'lite' and 'flash' to save quota.
    // Exhaustive list of model variants to find a working one
    const models = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-3-pro-preview",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.5-pro-001",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    // Get API Key (Support VITE prefix for dev consistency, though server usually uses standard)
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please set GEMINI_API_KEY in .env");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    let lastError = null;

    for (const modelName of models) {
        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
            try {
                if (retryCount > 0) {
                    console.log(`[AI Helper] Retrying ${modelName} (Attempt ${retryCount + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
                }

                console.log(`[AI Helper] Attempting generation with model: ${modelName}`);

                let generationConfig = {
                    model: modelName
                };

                let finalPrompt = prompt;

                // Handle system instructions compatibility
                if (systemInstruction) {
                    if (modelName === "gemini-pro") {
                        // gemini-pro (v1.0) does not support systemInstruction in config
                        finalPrompt = `${systemInstruction}\n\n${prompt}`;
                    } else {
                        // 1.5 versions and 2.0 support it natively
                        generationConfig.systemInstruction = { parts: [{ text: systemInstruction }] };
                    }
                }

                const model = genAI.getGenerativeModel(generationConfig);

                const result = await model.generateContent(finalPrompt);
                const response = await result.response;
                return response.text();

            } catch (error) {
                console.warn(`[AI Helper] Model ${modelName} failed: ${error.message} (Status: ${error.status})`);
                lastError = error;

                if (error.status === 400 || error.status === 404) {
                    break; // Don't retry bad request or not found, move to next model
                }

                if (error.status === 429 || error.status === 503) {
                    retryCount++;
                    if (retryCount <= maxRetries) continue; // Retry same model
                }

                break; // Move to next model for other errors
            }
        }
        // Wait a short bit before trying NEXT model
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(`All AI models failed. Last error: ${lastError?.message}`);
};

module.exports = { generateContentWithFallback };
