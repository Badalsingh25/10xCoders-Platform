const asyncHandler = require('express-async-handler');
const InterviewAttempt = require('../models/interviewModel');
const RoadmapProgress = require('../models/roadmapModel');
const TypingTest = require('../models/typingModel');

// @desc    Save interview attempt
// @route   POST /api/features/interview
// @access  Private
const saveInterviewAttempt = asyncHandler(async (req, res) => {
    const { question, score, feedback } = req.body;

    const attempt = await InterviewAttempt.create({
        userId: req.user.id,
        question,
        score,
        feedback
    });

    res.status(201).json(attempt);
});

// @desc    Get user interview attempts
// @route   GET /api/features/interview
// @access  Private
const getInterviewAttempts = asyncHandler(async (req, res) => {
    const attempts = await InterviewAttempt.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(attempts);
});

// @desc    Save roadmap progress
// @route   POST /api/features/roadmap
// @access  Private
const saveRoadmapProgress = asyncHandler(async (req, res) => {
    const { roadmap, currentStep, completedSteps } = req.body;

    let progress = await RoadmapProgress.findOne({ userId: req.user.id, roadmap });

    if (progress) {
        progress.currentStep = currentStep || progress.currentStep;
        progress.completedSteps = completedSteps || progress.completedSteps;
        await progress.save();
    } else {
        progress = await RoadmapProgress.create({
            userId: req.user.id,
            roadmap,
            currentStep,
            completedSteps
        });
    }

    res.status(200).json(progress);
});

// @desc    Get roadmap progress
// @route   GET /api/features/roadmap/:roadmapId
// @access  Private
const getRoadmapProgress = asyncHandler(async (req, res) => {
    const progress = await RoadmapProgress.findOne({ userId: req.user.id, roadmap: req.params.roadmapId });
    if (progress) {
        res.json(progress);
    } else {
        res.json({ currentStep: 'start', completedSteps: [] });
    }
});

// @desc    Save typing test result
// @route   POST /api/features/typing
// @access  Private
const saveTypingTest = asyncHandler(async (req, res) => {
    const { wpm, accuracy } = req.body;

    const test = await TypingTest.create({
        userId: req.user.id,
        wpm,
        accuracy
    });

    res.status(201).json(test);
});

// @desc    Get typing test results
// @route   GET /api/features/typing
// @access  Private
const getTypingTests = asyncHandler(async (req, res) => {
    const tests = await TypingTest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(tests);
});

module.exports = {
    saveInterviewAttempt,
    getInterviewAttempts,
    saveRoadmapProgress,
    getRoadmapProgress,
    saveTypingTest,
    getTypingTests
};
