const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../client/.env') });

const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
console.log("Checking API Key:", key ? "Found" : "Missing");

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

async function checkModels() {
    try {
        console.log("Requesting models list from Google REST API...");
        const response = await axios.get(url);
        console.log("Status:", response.status);
        console.log("Available Models:");
        if (response.data && response.data.models) {
            response.data.models.forEach(m => console.log(` - ${m.name} (${m.supportedGenerationMethods})`));
        } else {
            console.log("No models found in response:", response.data);
        }
    } catch (error) {
        console.error("API Request Failed:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

checkModels();
