const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../client/.env') });

const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!key) {
    console.error("No API Key found!");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

async function run() {
    try {
        console.log(`Checking models for key: ${key.substring(0, 5)}...`);
        const res = await axios.get(url);
        const models = res.data.models || [];
        const modelNames = models.map(m => m.name.replace('models/', ''));

        console.log("Models found:", modelNames.length);
        fs.writeFileSync('available_models.json', JSON.stringify(modelNames, null, 2));

        // Print all for visibility in tool output
        console.log("Available Models:", JSON.stringify(modelNames, null, 2));

    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error("Details:", JSON.stringify(e.response.data, null, 2));
    }
}

run();
