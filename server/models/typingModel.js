const mongoose = require('mongoose');

const typingTestSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        wpm: {
            type: Number,
            required: true,
        },
        accuracy: {
            type: Number,
            required: true,
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

module.exports = mongoose.model('TypingTest', typingTestSchema);
