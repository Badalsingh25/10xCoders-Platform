const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API KEY found in env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // There isn't a direct "listModels" on the instance in some versions, 
        // but the API is accessible via REST if needed, or we can just try a generation.
        // Actually, newer SDKs usually have a way.
        // Let's try to just generate with 'gemini-pro' and 'gemini-1.5-flash' specifically and log the EXACT error object.

        // Attempt 1: Gemini 1.5 Flash
        console.log("Testing gemini-1.5-flash...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Hello");
            console.log("SUCCESS: gemini-1.5-flash is working.");
            return;
        } catch (e) {
            console.error("FAIL: gemini-1.5-flash", e.message);
        }

        // Attempt 2: Gemini Pro
        console.log("Testing gemini-pro...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("Hello");
            console.log("SUCCESS: gemini-pro is working.");
            return;
        } catch (e) {
            console.error("FAIL: gemini-pro", e.message);
        }

    } catch (error) {
        console.error("Fatal error", error);
    }
}

listModels();
