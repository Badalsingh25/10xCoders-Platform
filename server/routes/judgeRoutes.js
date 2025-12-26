const express = require('express');
const router = express.Router();
const axios = require('axios');

// Judge0 Language ID Mapping
// Piston Language Map
const PISTON_RUNTIMES = {
    'c': { language: 'c', version: '10.2.0' },
    'cpp': { language: 'c++', version: '10.2.0' },
    'java': { language: 'java', version: '15.0.2' },
    'python': { language: 'python', version: '3.10.0' },
    'javascript': { language: 'javascript', version: '18.15.0' }, // Node.js
    'php': { language: 'php', version: '8.2.3' },
    'csharp': { language: 'csharp', version: '6.12.0' }, // Mono
};

router.post('/execute', async (req, res) => {
    try {
        const { source_code, language, stdin } = req.body;

        const runtime = PISTON_RUNTIMES[language.toLowerCase()];

        if (!runtime) {
            return res.status(400).json({ error: 'Unsupported language' });
        }

        // Use Piston Public API
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
            language: runtime.language,
            version: runtime.version,
            files: [
                {
                    content: source_code
                }
            ],
            stdin: stdin || ""
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;

        // Map Piston response to Judge0 format for frontend compatibility
        // Piston structure: { run: { stdout: "...", stderr: "...", code: 0 } }
        const result = {
            stdout: data.run.stdout,
            stderr: data.run.stderr,
            compile_output: data.compile ? data.compile.stderr : '', // Piston puts compile errors in compile object
            status: {
                description: data.run.code === 0 ? 'Accepted' : 'Runtime Error' // Simplified status
            }
        };

        res.json(result);

    } catch (error) {
        console.error('Piston Execution Error:', error.response ? error.response.data : error.message);
        res.status(500).json({
            error: 'Failed to execute code',
            details: error.response ? error.response.data : error.message
        });
    }
});

module.exports = router;
