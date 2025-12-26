const express = require('express');
const router = express.Router();
const {
    saveInterviewAttempt,
    getInterviewAttempts,
    saveRoadmapProgress,
    getRoadmapProgress,
    saveTypingTest,
    getTypingTests
} = require('../controllers/featureController');
const { protect } = require('../middleware/authMiddleware');

// Interview Routes
router.post('/interview', protect, saveInterviewAttempt);
router.get('/interview', protect, getInterviewAttempts);

// Roadmap Routes
router.post('/roadmap', protect, saveRoadmapProgress);
router.get('/roadmap/:roadmapId', protect, getRoadmapProgress);

// Typing Routes
router.post('/typing', protect, saveTypingTest);
router.get('/typing', protect, getTypingTests);

module.exports = router;
