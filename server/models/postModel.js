const mongoose = require('mongoose');

const postSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String, // For image-based doubts
        },
        tags: [{
            type: String,
        }],
        upvotes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        views: {
            type: Number,
            default: 0
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

module.exports = mongoose.model('Post', postSchema);
