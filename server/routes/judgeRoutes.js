const express = require('express');
const router = express.Router();
const axios = require('axios');

// Judge0 Language ID Mapping
const LANGUAGE_MAP = {
    'c': 50,
    'cpp': 54, // C++ (GCC 9.2.0)
    'java': 62, // Java (OpenJDK 13.0.1)
    'python': 71, // Python (3.8.1)
};

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

router.post('/execute', async (req, res) => {
    try {
        const { source_code, language, stdin } = req.body;

        const language_id = LANGUAGE_MAP[language.toLowerCase()];

        if (!language_id) {
            return res.status(400).json({ error: 'Unsupported language' });
        }

        const response = await axios.post(`${JUDGE0_URL}/submissions?wait=true`, {
            source_code,
            language_id,
            stdin: stdin || ""
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Judge0 Proxy Error:', error.response ? error.response.data : error.message);
        res.status(500).json({
            error: 'Failed to execute code',
            details: error.response ? error.response.data : error.message
        });
    }
});

module.exports = router;
