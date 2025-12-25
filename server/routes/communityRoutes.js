const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/postModel');
const Answer = require('../models/answerModel');
const User = require('../models/userModel');

// Multer Config
const storage = multer.diskStorage({
    destination(req, file, cb) {
        // Use absolute path relative to this file (server/routes/communityRoutes.js -> server/uploads)
        const uploadPath = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename(req, file, cb) {
        // Sanitize filename and timestamp
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

// Initialize Gemini
// Fallback key logic similar to quizRoutes
const apiKey = process.env.GEMINI_API_KEY;
const localGenAI = new GoogleGenerativeAI(apiKey);

// Helper to convert file to GenerativePart
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

// @desc    Get all posts
// @route   GET /api/community/posts
// @access  Private
router.get('/posts', protect, async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('userId', 'name avatar')
            .sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching posts" });
    }
});

// @desc    Get single post with answers
// @route   GET /api/community/posts/:id
// @access  Private
router.get('/posts/:id', protect, async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true })
            .populate('userId', 'name avatar');

        if (!post) return res.status(404).json({ message: "Post not found" });

        const answers = await Answer.find({ postId: req.params.id })
            .populate('userId', 'name avatar')
            .sort({ isAccepted: -1, upvotes: -1, createdAt: -1 }); // Accepted first, then best

        res.status(200).json({ post, answers });
    } catch (error) {
        res.status(500).json({ message: "Error fetching post details" });
    }
});

// @desc    Create a text post
// @route   POST /api/community/posts
// @access  Private
router.post('/posts', protect, async (req, res) => {
    try {
        const { title, description, tags, difficulty } = req.body;
        const post = await Post.create({
            userId: req.user.id,
            title,
            description,
            tags,
            // Assuming difficulty field might be added to model later, or we use tags
        });
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: "Error creating post" });
    }
});

// @desc    Get unanswered posts
// @route   GET /api/community/unanswered
// @access  Private
router.get('/unanswered', protect, async (req, res) => {
    try {
        const answeredPostIds = await Answer.distinct('postId');
        const posts = await Post.find({ _id: { $nin: answeredPostIds } })
            .populate('userId', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(5);
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching unanswered posts" });
    }
});

// @desc    Add an answer (Text + Image + Audio)
// @route   POST /api/community/answers
// @access  Private
router.post('/answers', protect, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req, res) => {
    try {
        console.log("Answer Upload Request Body:", req.body);
        console.log("Answer Upload Files:", req.files);

        const { postId, text } = req.body;
        let imageUrl = null;
        let audioUrl = null;

        if (req.files && req.files['image']) {
            imageUrl = `/uploads/${req.files['image'][0].filename}`;
        }
        if (req.files && req.files['audio']) {
            audioUrl = `/uploads/${req.files['audio'][0].filename}`;
            console.log("Audio uploaded to:", audioUrl);
        }

        const answer = await Answer.create({
            postId,
            userId: req.user.id,
            text: text || "Audio Answer",
            imageUrl,
            audioUrl
        });

        // Add reputation to answerer (simple logic)
        await User.findByIdAndUpdate(req.user.id, { $inc: { reputation: 5 } });

        const populatedAnswer = await Answer.findById(answer._id).populate('userId', 'name avatar');

        res.status(201).json(populatedAnswer);
    } catch (error) {
        console.log("Answer Upload Error:", error);
        res.status(500).json({ message: "Error adding answer" });
    }
});


// @desc    Upvote Post or Answer
// @route   PUT /api/community/vote
// @access  Private
router.put('/vote', protect, async (req, res) => {
    try {
        const { id, type } = req.body; // type: 'post' or 'answer'

        let doc;
        if (type === 'post') {
            doc = await Post.findById(id);
        } else {
            doc = await Answer.findById(id);
        }

        if (!doc) return res.status(404).json({ message: "Not found" });

        // Toggle vote
        const index = doc.upvotes.indexOf(req.user.id);
        if (index === -1) {
            doc.upvotes.push(req.user.id);
            // Award reputation to author
            await User.findByIdAndUpdate(doc.userId, { $inc: { reputation: 10 } });
        } else {
            doc.upvotes.splice(index, 1);
            // Remove reputation
            await User.findByIdAndUpdate(doc.userId, { $inc: { reputation: -10 } });
        }

        await doc.save();
        res.status(200).json(doc.upvotes);

    } catch (error) {
        res.status(500).json({ message: "Vote failed" });
    }
});

// @desc    Accept Answer
// @route   PUT /api/community/accept-answer
// @access  Private
router.put('/accept-answer', protect, async (req, res) => {
    try {
        const { answerId, postId } = req.body;

        const post = await Post.findById(postId);
        if (post.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: "Only author can accept answer" });
        }

        const answer = await Answer.findById(answerId);
        if (!answer) return res.status(404).json({ message: "Answer not found" });

        // Un-accept previous if any (optional, usually one accepted answer)
        await Answer.updateMany({ postId }, { isAccepted: false });

        answer.isAccepted = true;
        await answer.save();

        // Bonus reputation for accepted answer
        await User.findByIdAndUpdate(answer.userId, { $inc: { reputation: 20 } });

        res.status(200).json(answer);

    } catch (error) {
        res.status(500).json({ message: "Failed to accept answer" });
    }
});


// @desc    AI Image Solve (Just Extract & Post) - NO Auto Answer
// @route   POST /api/community/ai-solve
// @access  Private
router.post('/ai-solve', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image uploaded" });
        }

        const imagePath = req.file.path;
        const mimeType = req.file.mimetype;
        const imageUrl = `/uploads/${req.file.filename}`; // Serve URL for frontend

        // 1. Vision API - Extract Question
        const model = localGenAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            You are an expert OCR and Tech Assistant.
            1. Analyze the uploaded image.
            2. Extract any question, doubt, error message, or code present in the image.
            
            Return the output in this specific JSON format:
            {
                "extractedQuestion": "The text of the question found in the image...",
                "tags": ["Tag1", "Tag2"]
            }
            Strictly JSON.
        `;

        const imagePart = fileToGenerativePart(imagePath, mimeType);
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        let text = response.text();

        if (!text) throw new Error("Empty response from AI");

        // Robust JSON cleanup
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            text = text.substring(firstBrace, lastBrace + 1);
        } else {
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        const aiData = JSON.parse(text);

        // 2. Create Community Post (BUT NO ANSWER YET)
        const post = await Post.create({
            userId: req.user.id,
            title: "Image Doubt Request",
            description: aiData.extractedQuestion || "Help with this image question",
            imageUrl: imageUrl,
            tags: aiData.tags || ["Doubt", "Image"],
            isAI: false // It's a user request essentially, managed by AI tool
        });

        const populatedPost = await Post.findById(post._id).populate('userId', 'name avatar');

        res.status(200).json({ post: populatedPost });

    } catch (error) {
        console.error("AI Solve Error:", error);
        res.status(500).json({ message: "Failed to process doubt" });
    }
});

// @desc    Generate AI Answer for a Post (On Demand)
// @route   POST /api/community/generate-answer/:postId
// @access  Private
router.post('/generate-answer/:postId', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const model = localGenAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        let prompt;
        // Construct prompt based on if it has image or just text
        // (For now, simplified to text-based prompt unless we re-read image, which is complex. 
        //  We will use post description which likely contains extracted text for image posts, or user text)

        prompt = `
            You are an expert tutor.
            The student has asked: "${post.title}"
            Details: "${post.description}"
            
            Please provide a comprehensive, step-by-step solution to this question.
            Be polite and encouraging.
        `;

        if (post.imageUrl) {
            // If we could access the image again efficiently we would. 
            // For now relying on the description which was extracted from OCR is usually sufficient.
            prompt += `\n (Context: The user also uploaded an image relating to this query)`;
        }

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Create the Answer
        const answer = await Answer.create({
            postId: post._id,
            userId: req.user.id, // Or special AI user if possible. Attributing to req.user for "You used AI"
            text: text,
            isAI: true
        });

        const populatedAnswer = await Answer.findById(answer._id).populate('userId', 'name avatar');

        res.status(201).json(populatedAnswer);

    } catch (error) {
        console.error("AI Answer Gen Error:", error);
        res.status(500).json({ message: "Failed to generate answer" });
    }
});

module.exports = router;
