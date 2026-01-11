const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.log("No API Key found");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        const modelList = await genAI.getGenerativeModel({ model: "gemini-pro" });
        // effectively checking if we can auth. 
        // Actually SDK exposes specific listModels logic via API but usually simplest is just to try known models.
        // But there is a direct way:

        // Note: SDK doesn't always expose listModels directly on the main class in all versions, 
        // but we can try basic fetch if needed. 
        // However, let's try to assume the key is valid and just print what happens for 'gemini-pro'.

        console.log("Testing gemini-pro...");
        const result = await modelList.generateContent("Test");
        console.log("gemini-pro Works!");
    } catch (error) {
        console.error("gemini-pro Failed:", error.message);
    }
}

listModels();
