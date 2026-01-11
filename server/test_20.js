const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test20() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        console.log("Testing gemini-2.0-flash-exp...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent("Test");
        console.log("gemini-2.0-flash-exp Works!");
    } catch (error) {
        console.error("gemini-2.0-flash-exp Failed:", error.message);
    }
}

test20();
