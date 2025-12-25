const mongoose = require('mongoose');

const quizAttemptSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        topic: {
            type: String,
            required: true
        },
        difficulty: {
            type: String,
            default: 'Intermediate'
        },
        score: {
            type: Number,
            required: true,
        },
        totalQuestions: {
            type: Number,
            required: true
        },
        weakAreas: {
            type: [String], // Array of strings describing weak concepts
            default: []
        },
        improvementTips: {
            type: String
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
