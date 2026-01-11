const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listAllModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found.");
        return;
    }

    // We'll use a direct fetch to the API to be sure, avoiding SDK abstractions for a moment
    // specific endpoint for listing models
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (Version: ${m.version})`);
                }
            });
        } else {
            console.log("No models returned or error structure:", data);
        }

    } catch (error) {
        console.error("Listing failed:", error);
    }
}

listAllModels();
