const asyncHandler = require('express-async-handler');
const InterviewAttempt = require('../models/interviewModel');
const RoadmapProgress = require('../models/roadmapModel');
const TypingTest = require('../models/typingModel');
const User = require('../models/userModel');

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

    // Log Activity & Award Points (+15 for Interview)
    const user = await User.findById(req.user.id);
    user.gamification = user.gamification || { points: 0, level: 'Beginner', badges: [] };
    user.gamification.points += 15;

    // Level Up Logic
    if (user.gamification.points >= 500) user.gamification.level = 'Pro';
    else if (user.gamification.points >= 100) user.gamification.level = 'Intermediate';

    user.activityLog.push({
        action: 'interview_attempt',
        details: `Interview Question: ${question.substring(0, 30)}... (+15 XP)`,
        timestamp: new Date()
    });
    await user.save();

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

    // Log Activity & Award Points (+10 for Roadmap)
    const user = await User.findById(req.user.id);
    user.gamification = user.gamification || { points: 0, level: 'Beginner', badges: [] };
    user.gamification.points += 10;

    // Level Up Logic
    if (user.gamification.points >= 500) user.gamification.level = 'Pro';
    else if (user.gamification.points >= 100) user.gamification.level = 'Intermediate';

    user.activityLog.push({
        action: 'roadmap_progress',
        details: `Updated Roadmap: ${roadmap.substring(0, 20)}... (+10 XP)`,
        timestamp: new Date()
    });
    await user.save();

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

    // Log Activity & Award Points (+5 for Typing)
    const user = await User.findById(req.user.id);
    user.gamification = user.gamification || { points: 0, level: 'Beginner', badges: [] };
    user.gamification.points += 5;

    // Level Up Logic
    if (user.gamification.points >= 500) user.gamification.level = 'Pro';
    else if (user.gamification.points >= 100) user.gamification.level = 'Intermediate';

    user.activityLog.push({
        action: 'typing_test',
        details: `Typing Test: ${wpm} WPM (+5 XP)`,
        timestamp: new Date()
    });
    await user.save();

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
