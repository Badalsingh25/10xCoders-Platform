const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const TwitterStrategy = require('passport-twitter-oauth2').Strategy;
const User = require('../models/userModel');

const configurePassport = () => {
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

    // Google
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_google_id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_google_secret',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${BACKEND_URL}/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                user = await User.create({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    avatar: profile.photos[0].value
                });
            }
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));

    // GitHub
    if (process.env.GITHUB_CLIENT_ID) {
        passport.use(new GitHubStrategy({
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL || `${BACKEND_URL}/auth/github/callback`
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ githubId: profile.id });
                if (!user) {
                    user = await User.create({
                        name: profile.displayName || profile.username,
                        email: profile.emails ? profile.emails[0].value : `${profile.username}@github.com`,
                        githubId: profile.id,
                        avatar: profile.photos[0].value
                    });
                }
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }));
    }

    // Facebook
    if (process.env.FACEBOOK_CLIENT_ID) {
        passport.use(new FacebookStrategy({
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            callbackURL: process.env.FACEBOOK_CALLBACK_URL || `${BACKEND_URL}/auth/facebook/callback`,
            profileFields: ['id', 'displayName', 'photos', 'email']
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ facebookId: profile.id });
                if (!user) {
                    user = await User.create({
                        name: profile.displayName,
                        email: profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`,
                        facebookId: profile.id,
                        avatar: profile.photos ? profile.photos[0].value : null
                    });
                }
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }));
    }

    // LinkedIn
    if (process.env.LINKEDIN_CLIENT_ID) {
        passport.use(new LinkedInStrategy({
            clientID: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
            callbackURL: process.env.LINKEDIN_CALLBACK_URL || `${BACKEND_URL}/auth/linkedin/callback`,
            scope: ['r_liteprofile', 'r_emailaddress'],
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ linkedinId: profile.id });
                if (!user) {
                    user = await User.create({
                        name: profile.displayName,
                        email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : "",
                        linkedinId: profile.id,
                        avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null
                    });
                }
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }));
    }

    // Twitter
    if (process.env.TWITTER_CLIENT_ID) {
        passport.use(new TwitterStrategy({
            clientID: process.env.TWITTER_CLIENT_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET || 'none', // Handle empty secret
            callbackURL: process.env.TWITTER_CALLBACK_URL || `${BACKEND_URL}/auth/twitter/callback`,
            clientType: 'confidential'
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ twitterId: profile.id });
                if (!user) {
                    user = await User.create({
                        name: profile.displayName,
                        email: profile.emails ? profile.emails[0].value : `${profile.username}@twitter.com`,
                        twitterId: profile.id,
                        avatar: profile.photos ? profile.photos[0].value : null
                    });
                }
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }));
    }

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};

module.exports = configurePassport;
