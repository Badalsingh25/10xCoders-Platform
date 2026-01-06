const express = require('express');
const router = express.Router();
const { askAI, translateCode } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/ask', protect, askAI);
router.post('/translate', protect, translateCode);

module.exports = router;
