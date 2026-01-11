const express = require('express');
const router = express.Router();
const {
    askAI,
    translateCode,
    getUserChats,
    getChatById,
    createChat,
    deleteChat,
    saveMessage
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/ask', protect, askAI);
router.post('/translate', protect, translateCode);

// Chat Routes
router.get('/history', protect, getUserChats);
router.get('/chat/:id', protect, getChatById);
router.post('/chat', protect, createChat);
router.delete('/chat/:id', protect, deleteChat);
router.put('/message', protect, saveMessage); // Optional, mostly managed by askAI

module.exports = router;
