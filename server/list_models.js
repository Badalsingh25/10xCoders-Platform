require('dotenv').config({ path: require('path').resolve(__dirname, '../client/.env') });
const https = require('https');

const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (!key) {
    console.error("No API Key found!");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`Status Code: ${res.statusCode}`);
            console.error(data);
            return;
        }
        try {
            const json = JSON.parse(data);
            console.log("Available Models (Gemini only):");
            const names = json.models.map(m => m.name).filter(n => n.includes('gemini')).sort();
            names.forEach(n => console.log(n));
        } catch (e) {
            console.error("Error parsing JSON:", e.message);
            console.log(data);
        }
    });
}).on('error', (err) => {
    console.error("Error:", err.message);
});
