const mongoose = require('mongoose');

const interviewAttemptSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        question: {
            type: String,
            required: true,
        },
        score: {
            type: Number,
            required: true,
        },
        feedback: {
            type: String,
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

module.exports = mongoose.model('InterviewAttempt', interviewAttemptSchema);
