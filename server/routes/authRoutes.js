const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const handleCallback = (req, res) => {
    const token = generateToken(req.user._id);
    // Redirect to frontend with token in query param - BACK TO /home as requested
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/home?token=${token}`);
};

// Google
router.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { session: false }), handleCallback);

// GitHub
router.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/auth/github/callback', passport.authenticate('github', { session: false }), handleCallback);

// Facebook
router.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/auth/facebook/callback', passport.authenticate('facebook', { session: false }), handleCallback);

// LinkedIn
router.get('/api/auth/linkedin', passport.authenticate('linkedin', { scope: ['r_liteprofile', 'r_emailaddress'] }));
router.get('/auth/linkedin/callback', passport.authenticate('linkedin', { session: false }), handleCallback);

// Twitter
router.get('/api/auth/twitter', passport.authenticate('twitter', { scope: ['users.read', 'tweet.read', 'offline.access'] }));
router.get('/auth/twitter/callback', passport.authenticate('twitter', { session: false }), handleCallback);

module.exports = router;
