const express = require('express');
const router = express.Router();
const { askAI } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/ask', protect, askAI);

module.exports = router;
