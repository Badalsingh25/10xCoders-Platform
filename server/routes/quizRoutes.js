const express = require('express');
const router = express.Router();
// const { GoogleGenerativeAI } = require("@google/generative-ai"); // Removed
const { generateContentWithFallback } = require('../utils/aiHelper');
const { protect } = require('../middleware/authMiddleware');
const QuizAttempt = require('../models/quizModel');

// @desc    Generate a Quiz (Topic or Resume based)
// @route   POST /api/quiz/generate
// @access  Private
router.post('/generate', protect, async (req, res) => {
    const { type, topic, difficulty, count = 5, resumeSkills } = req.body;

    try {
        let prompt = "";

        if (type === 'RESUME') {
            prompt = `
                You are an expert technical interviewer.
                Based on the following resume skills: ${resumeSkills}.
                Generate ${count} ${difficulty || 'Intermediate'} level interview-style quiz questions to assess real understanding.
                For each question, provide 4 options, the correct answer, and a short explanation.
                
                STRICTLY return the response in this JSON format:
                [
                    {
                        "question": "Question text here",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correctAnswer": "Option B", 
                        "explanation": "Explanation here"
                    }
                ]
                Do not include markdown filtering (like \`\`\`json). Just the raw JSON array.
            `;
        } else {
            // Topic based
            prompt = `
                You are an expert technical instructor.
                Generate ${count} ${difficulty || 'Intermediate'} level quiz questions on the topic: "${topic}".
                For each question, provide 4 options, the correct answer, and a short explanation.
                
                STRICTLY return the response in this JSON format:
                [
                    {
                        "question": "Question text here",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correctAnswer": "Option B",
                        "explanation": "Explanation here"
                    }
                ]
                Do not include markdown filtering (like \`\`\`json). Just the raw JSON array.
            `;
        }

        const text = await generateContentWithFallback(prompt);

        // Robust JSON cleanup
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        let jsonStr = text;

        if (firstBracket !== -1 && lastBracket !== -1) {
            jsonStr = text.substring(firstBracket, lastBracket + 1);
        } else {
            jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        const quizData = JSON.parse(jsonStr);

        res.status(200).json(quizData);

    } catch (error) {
        console.error("Quiz Gen Error:", error);
        res.status(500).json({ message: "Failed to generate quiz", error: error.message });
    }
});

// @desc    Submit Quiz Result
// @route   POST /api/quiz/submit
// @access  Private
router.post('/submit', protect, async (req, res) => {
    try {
        const { topic, difficulty, score, totalQuestions, weakAreas, improvementTips } = req.body;

        const attempt = await QuizAttempt.create({
            userId: req.user.id,
            topic,
            difficulty,
            score,
            totalQuestions,
            weakAreas,
            improvementTips
        });

        res.status(201).json(attempt);
    } catch (error) {
        console.error("Quiz Submit Error:", error);
        res.status(500).json({ message: "Failed to save quiz result" });
    }
});

// @desc    Analyze Quiz Results (Get Weak Areas & Tips)
// @route   POST /api/quiz/analyze
// @access  Private
router.post('/analyze', protect, async (req, res) => {
    try {
        const { topic, questions, userAnswers } = req.body;
        // questions: array of full question objects
        // userAnswers: array of user's selected answers (or map index)

        // Identify wrong answers
        const wrongAnswers = questions.filter((q, idx) => {
            const selected = userAnswers[idx];
            // Check if selected answer string matches correct answer string
            return selected !== q.correctAnswer;
        });

        if (wrongAnswers.length === 0) {
            return res.status(200).json({
                weakAreas: [],
                improvementTips: "Excellent work! You answered everything correctly. Keep challenging yourself with harder topics."
            });
        }

        // Prepare prompt for AI
        const mistakesText = wrongAnswers.map(q => `Question: ${q.question} | Correct: ${q.correctAnswer}`).join('\n');

        const prompt = `
            The student took a quiz on "${topic}" and got the following questions wrong:
            ${mistakesText}

            Please analyze these mistakes.
            1. Identify 1-3 specific "Weak Areas" (concepts they missed).
            2. Provide a short, encouraging paragraph of "Improvement Tips" or resources to study.

            STRICTLY return JSON:
            {
                "weakAreas": ["Concept 1", "Concept 2"],
                "improvementTips": "Your advice here..."
            }
            Do not include markdown.
        `;

        const text = await generateContentWithFallback(prompt);

        // Robust JSON cleanup
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        let jsonStr = text;

        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = text.substring(firstBrace, lastBrace + 1);
        } else {
            jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        const analysis = JSON.parse(jsonStr);

        res.status(200).json(analysis);

    } catch (error) {
        console.error("Quiz Analysis Error:", error);
        res.status(500).json({ message: "Failed to analyze results" });
    }
});

module.exports = router;
