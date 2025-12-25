const mongoose = require('mongoose');

const roadmapProgressSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        roadmap: {
            type: String,
            required: true,
        },
        completedSteps: [{
            type: String,
        }],
        currentStep: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('RoadmapProgress', roadmapProgressSchema);
