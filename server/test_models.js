require('dotenv').config({ path: require('path').resolve(__dirname, '../client/.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (!key) {
    console.error("No API Key found!");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(key);

const modelsToTest = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro",
    "gemini-1.0-pro"
];

async function testModels() {
    console.log("Testing models with key starting: " + key.substring(0, 5) + "...");

    for (const modelName of modelsToTest) {
        console.log(`\nTesting: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'OK'");
            const response = await result.response;
            console.log(`SUCCESS: ${modelName} responded: ${response.text().trim()}`);
        } catch (error) {
            console.log(`FAIL: ${modelName} - ${error.message.split('\n')[0]}`);
        }
    }
}

testModels();
