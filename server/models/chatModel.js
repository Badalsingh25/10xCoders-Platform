const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'New Chat'
    },
    context: {
        type: String,
        enum: ['GENERAL', 'COURSE_DOUBT', 'CODE_EXPLANATION', 'INTERVIEW_PREP', 'RESUME_HELP', 'CODE_TUTOR', 'ROADMAP_GEN'],
        default: 'GENERAL'
    },
    messages: [
        {
            role: {
                type: String,
                enum: ['user', 'model'],
                required: true
            },
            text: {
                type: String, // Store markdown content
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model('Chat', chatSchema);
