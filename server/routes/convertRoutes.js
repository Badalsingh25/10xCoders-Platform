const express = require('express');
const router = express.Router();
const ILovePDFApi = require('@ilovepdf/ilovepdf-nodejs');
const ILovePDFFile = require('@ilovepdf/ilovepdf-nodejs/ILovePDFFile');
const fs = require('fs');
const path = require('path');
const os = require('os');
const multer = require('multer');

// Workaround for missing Generic Task in SDK
// We need to import the internal base class
let TaskBaseProcess;
try {
    TaskBaseProcess = require('@ilovepdf/ilovepdf-js-core/tasks/TaskBaseProcess').default;
} catch (e) {
    // If submodule path is different
    try {
        TaskBaseProcess = require('@ilovepdf/ilovepdf-nodejs/node_modules/@ilovepdf/ilovepdf-js-core/tasks/TaskBaseProcess').default;
    } catch (e2) {
        console.error("Critical: Could not load TaskBaseProcess", e2);
    }
}

class GenericTask extends TaskBaseProcess {
    constructor(auth, xhr, toolName) {
        super(auth, xhr, {});
        this.type = toolName;
    }
}
// Initialize API
const ilovepdf = new ILovePDFApi(
    process.env.ILOVEAPI_PUBLIC_KEY,
    process.env.ILOVEAPI_SECRET_KEY
);

// Initialize ConvertAPI
const ConvertAPI = require('convertapi');
const convertapi = new ConvertAPI(process.env.CONVERTAPI_SECRET);

// Helper to write buffer to temp file
const writeTempFile = (buffer, originalName) => {
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `upload_${Date.now()}_${originalName}`);
    fs.writeFileSync(tempPath, buffer);
    return tempPath;
};

// Helper for iLovePDF conversion
const handleConversion = async (req, res, toolName, outputExt) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    let tempInputPath = null;

    try {
        // Use GenericTask to bypass strict TaskFactory checks
        const task = new GenericTask(ilovepdf.auth, ilovepdf.xhr, toolName);
        await task.start();

        // Write buffer to temp file
        tempInputPath = writeTempFile(req.file.buffer, req.file.originalname);

        const file = new ILovePDFFile(tempInputPath);
        await task.addFile(file);

        await task.process();

        const data = await task.download();

        // Set headers for download
        const filename = req.file.originalname.replace(/\.[^/.]+$/, "") + `.${outputExt}`;
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);

    } catch (error) {
        console.error(`${toolName} error:`, error);
        res.status(500).json({ message: 'Conversion failed', error: error.message });
    } finally {
        // Cleanup input file
        if (tempInputPath && fs.existsSync(tempInputPath)) {
            fs.unlinkSync(tempInputPath);
        }
    }
};

// Helper for ConvertAPI conversion
const handleConvertApi = async (req, res, targetFormat, sourceFormat = 'pdf') => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    let tempInputPath = null;
    try {
        tempInputPath = writeTempFile(req.file.buffer, req.file.originalname);

        const params = { File: tempInputPath };
        let result = await convertapi.convert(targetFormat, params, sourceFormat);

        // Special case: If split returns multiple files, zip them
        if (targetFormat === 'split' && result.files && result.files.length > 1) {
            result = await convertapi.convert('zip', { Files: result.files });
            targetFormat = 'zip'; // Update extension for filename
        }

        // ConvertAPI returns a URL or file content. By default it streams or gives URL.
        // We'll redirect to the URL for simplicity as suggested, OR fetch and stream if we want to hide the URL.
        // User's example used res.redirect(result.files[0].Url);
        // But our frontend expects a blob response usually.
        // If we redirect, axios might follow handling?
        // Actually, PdfTools.jsx expects a blob response.
        // If we redirect, the browser (axios) will follow the redirect and download the content?
        // Let's try to stream the content to match our specific frontend Blob handling.

        const fileUrl = result.files[0].url;
        const axios = require('axios');
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

        const filename = req.file.originalname.replace(/\.[^/.]+$/, "") + `.${targetFormat}`;
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(response.data);

    } catch (error) {
        console.error(`ConvertAPI ${sourceFormat}->${targetFormat} error:`, error.message);
        res.status(500).json({ message: 'Conversion failed (ConvertAPI)', error: error.toString() });
    } finally {
        if (tempInputPath && fs.existsSync(tempInputPath)) {
            fs.unlinkSync(tempInputPath);
        }
    }
}

const upload = multer({ storage: multer.memoryStorage() });

// Routes

// --- iLovePDF Routes (Office -> PDF/Doc) ---
router.post('/word-to-pdf', upload.single('file'), async (req, res) => {
    await handleConversion(req, res, 'officepdf', 'pdf');
});

router.post('/ppt-to-pdf', upload.single('file'), async (req, res) => {
    await handleConversion(req, res, 'officepdf', 'pdf');
});

router.post('/excel-to-pdf', upload.single('file'), async (req, res) => {
    await handleConversion(req, res, 'officepdf', 'pdf');
});

// --- ConvertAPI Routes (PDF -> Office, EML, HTML, Split) ---

router.post('/pdf-to-word', upload.single('file'), async (req, res) => {
    await handleConvertApi(req, res, 'docx', 'pdf');
});

router.post('/pdf-to-ppt', upload.single('file'), async (req, res) => {
    await handleConvertApi(req, res, 'pptx', 'pdf');
});

router.post('/pdf-to-excel', upload.single('file'), async (req, res) => {
    await handleConvertApi(req, res, 'xlsx', 'pdf');
});

router.post('/pdf-to-html', upload.single('file'), async (req, res) => {
    await handleConvertApi(req, res, 'html', 'pdf');
});

router.post('/eml-to-pdf', upload.single('file'), async (req, res) => {
    // Determine source format from extension if possible, default to eml
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    const source = (ext === 'msg') ? 'msg' : 'eml';
    await handleConvertApi(req, res, 'pdf', source);
});

// Split is a bit different because it returns a zip usually or multiple files. 
// ConvertAPI "split" parameter or "split" conversion?
// convertapi.convert('split', ...) -> returns ZIP usually if multiple files.
// Let's assume zip output for split.
// Split returns multiple files. For now, we return the first one (first page/part) 
// or we need to zip them. ConvertAPI doesn't split-to-zip directly in one call broadly known.
// But let's try 'split' format which is correct for the tool.
router.post('/split-pdf', upload.single('file'), async (req, res) => {
    // 'split' is the correct conversion format to trigger the split tool
    await handleConvertApi(req, res, 'split', 'pdf');
});

module.exports = router;
