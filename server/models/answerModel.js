const mongoose = require('mongoose');

const answerSchema = mongoose.Schema(
    {
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Post',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        text: {
            type: String,
            required: true
        },
        imageUrl: {
            type: String
        },
        audioUrl: {
            type: String
        },
        upvotes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        isAccepted: {
            type: Boolean,
            default: false
        },
        isAI: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Answer', answerSchema);
