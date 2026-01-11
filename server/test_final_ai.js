const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { generateContentWithFallback } = require('./utils/aiHelper');

async function testFinal() {
    console.log("Testing AI Helper with NEW model list...");
    try {
        const response = await generateContentWithFallback("Explain AI in one sentence.", "You are a concise tech expert.");
        console.log("Success! Response:", response);
    } catch (error) {
        console.error("Test Failed Fully:", error.message);
    }
}

testFinal();
