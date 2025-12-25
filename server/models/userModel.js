const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId && !this.githubId && !this.facebookId && !this.linkedinId && !this.twitterId;
      },
      minlength: 6,
    },
    googleId: String,
    githubId: String,
    facebookId: String,
    linkedinId: String,
    twitterId: String,
    avatar: String,
    phone: String,
    address: String,
    github: String,
    linkedin: String,
    twitter: String,
    courses: [{
      courseId: String,
      title: String,
      progress: { type: Number, default: 0 },
      enrolledAt: { type: Date, default: Date.now },
      completed: { type: Boolean, default: false }
    }],
    savedResumes: [{
      title: String,
      data: Object, // Store JSON resume data or file URL
      createdAt: { type: Date, default: Date.now }
    }],
    certificates: [{
      title: String,
      fileUrl: String, // Path or URL to the uploaded certificate
      uploadedAt: { type: Date, default: Date.now }
    }],
    roadmaps: [{
      roadmapId: String,
      title: String,
      progress: { type: Number, default: 0 },
      status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' }
    }],
    activityLog: [{
      action: String, // 'completed_lesson', 'created_resume', 'passed_quiz'
      details: String,
      timestamp: { type: Date, default: Date.now }
    }],
    // New Fields for Dashboard & Navbar
    streak: {
      current: { type: Number, default: 0 },
      lastLogin: { type: Date },
      lastActiveDate: { type: Date } // Explicitly requested field name
    },
    totalLearningMinutes: { type: Number, default: 0 }, // Requested: totalLearningMinutes
    codingHours: { type: Number, default: 0 },
    notifications: [{
      message: { type: String },
      read: { type: Boolean, default: false },
      date: { type: Date, default: Date.now },
      type: { type: String, enum: ['info', 'success', 'warning', 'alert'], default: 'info' }
    }],
    settings: {
      theme: { type: String, default: 'light' },
      emailNotifications: { type: Boolean, default: true }
    },
    reputation: { type: Number, default: 0 }
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    next();
  } else {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // If no password set (e.g. OAuth), fail
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 