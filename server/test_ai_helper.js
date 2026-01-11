const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { generateContentWithFallback } = require('./utils/aiHelper');

async function testAI() {
    console.log("Testing AI Helper...");
    try {
        const response = await generateContentWithFallback("Explain quantum computing in 5 words.", "You are a concise science teacher.");
        console.log("Success! Response:", response);
    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testAI();
