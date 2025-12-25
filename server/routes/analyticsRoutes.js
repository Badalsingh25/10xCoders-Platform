const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const RoadmapProgress = require('../models/roadmapModel');
const TypingTest = require('../models/typingModel');
const InterviewAttempt = require('../models/interviewModel');

// @desc    Save Roadmap Progress
// @route   POST /api/analytics/roadmap
// @access  Private
router.post('/roadmap', protect, async (req, res) => {
    try {
        const { roadmap, completedSteps, currentStep } = req.body;

        let progress = await RoadmapProgress.findOne({ userId: req.user.id, roadmap });

        if (progress) {
            progress.completedSteps = completedSteps;
            progress.currentStep = currentStep;
            await progress.save();
        } else {
            progress = await RoadmapProgress.create({
                userId: req.user.id,
                roadmap,
                completedSteps,
                currentStep
            });
        }
        res.status(200).json(progress);
    } catch (error) {
        res.status(500).json({ message: "Error saving roadmap progress" });
    }
});

// @desc    Get Roadmap Progress
// @route   GET /api/analytics/roadmap
// @access  Private
router.get('/roadmap', protect, async (req, res) => {
    try {
        const progress = await RoadmapProgress.find({ userId: req.user.id });
        res.status(200).json(progress);
    } catch (error) {
        res.status(500).json({ message: "Error fetching roadmap progress" });
    }
});


// @desc    Save Typing Test
// @route   POST /api/analytics/typing
// @access  Private
router.post('/typing', protect, async (req, res) => {
    try {
        const { wpm, accuracy } = req.body;
        const test = await TypingTest.create({
            userId: req.user.id,
            wpm,
            accuracy
        });
        res.status(201).json(test);
    } catch (error) {
        res.status(500).json({ message: "Error saving typing test" });
    }
});

// @desc    Get Typing History
// @route   GET /api/analytics/typing
// @access  Private
router.get('/typing', protect, async (req, res) => {
    try {
        const history = await TypingTest.find({ userId: req.user.id }).sort({ date: -1 });
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: "Error fetching typing history" });
    }
});


// @desc    Save Interview Attempt
// @route   POST /api/analytics/interview
// @access  Private
router.post('/interview', protect, async (req, res) => {
    try {
        const { question, score, feedback } = req.body;
        const attempt = await InterviewAttempt.create({
            userId: req.user.id,
            question,
            score,
            feedback
        });
        res.status(201).json(attempt);
    } catch (error) {
        res.status(500).json({ message: "Error saving interview attempt" });
    }
});

// @desc    Get Interview Attempts
// @route   GET /api/analytics/interview
// @access  Private
router.get('/interview', protect, async (req, res) => {
    try {
        const attempts = await InterviewAttempt.find({ userId: req.user.id }).sort({ date: -1 });
        res.status(200).json(attempts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching interview attempts" });
    }
});

module.exports = router;
