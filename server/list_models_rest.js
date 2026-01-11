const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API KEY found in env");
    process.exit(1);
}

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await axios.get(url);
        console.log("Available Models:");
        const models = response.data.models;
        if (models) {
            models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (Display: ${m.displayName})`);
                }
            });
        } else {
            console.log("No models array found in response", response.data);
        }
    } catch (error) {
        console.error("Error listing models:", error.response ? error.response.data : error.message);
    }
}

listModels();
