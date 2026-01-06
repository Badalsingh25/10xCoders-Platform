const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Otp = require("../models/otpModel");
const InterviewAttempt = require('../models/interviewModel');
const TypingTest = require('../models/typingModel');
const RoadmapProgress = require('../models/roadmapModel');
const nodemailer = require("nodemailer");

// ==========================
// EMAIL SETUP
// ==========================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==========================
// HELPER FUNCTIONS
// ==========================
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ==========================
// SEND OTP
// ==========================
exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    // Remove existing OTP
    await Otp.deleteOne({ email });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.create({
      email,
      otp,
      createdAt: new Date(),
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("OTP Error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};



// ==========================
// VERIFY OTP
// ==========================
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  const record = await Otp.findOne({ email });
  if (!record) return res.status(400).json({ message: "OTP expired or invalid" });

  if (String(record.otp) !== String(otp)) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // Do NOT delete here. Let the final action (register/reset) delete it.
  // await Otp.deleteOne({ email }); 

  res.status(200).json({ message: "OTP verified successfully" });
};

// ==========================
// REGISTER USER
// ==========================
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  const userExists = await User.findOne({ email });
  if (userExists)
    return res.status(400).json({ message: "User already exists" });

  const user = await User.create({
    name,
    email,
    password,
    notifications: [{
      message: "Welcome to 10xCoders! Start your journey by exploring courses.",
      type: "success",
      read: false,
      date: new Date()
    }]
  });

  res.status(201).json({
    message: "Registration successful",
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

// ==========================
// MARK NOTIFICATIONS READ
// ==========================
exports.markNotificationsRead = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $set: { "notifications.$[].read": true }
    });
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error updating notifications" });
  }
};

// ==========================
// LOGIN
// ==========================
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await user.matchPassword(password);
  if (!isMatch)
    return res.status(401).json({ message: "Invalid credentials" });

  res.json({
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

// ==========================
// RESET PASSWORD
// ==========================
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const record = await Otp.findOne({ email });
    if (!record || String(record.otp) !== String(otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    // Delete OTP after usage
    await Otp.deleteOne({ email });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset Password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// ==========================
// GET ME
// ==========================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // --- Smart Streak Logic (Updated on Profile Load) ---
    const now = new Date();
    // Use lastActiveDate if present, else fallback to lastLogin
    const lastActive = user.streak?.lastActiveDate ? new Date(user.streak.lastActiveDate) : (user.streak?.lastLogin ? new Date(user.streak.lastLogin) : null);

    if (lastActive) {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastActiveStart = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

      const dayDifference = Math.floor((todayStart - lastActiveStart) / (1000 * 60 * 60 * 24));

      if (dayDifference === 1) {
        // Active yesterday -> Increment Streak
        user.streak = {
          current: (user.streak.current || 0) + 1,
          lastActiveDate: now,
          lastLogin: now
        };
        await user.save();
      } else if (dayDifference > 1) {
        // Missed a day -> Reset Streak
        user.streak = {
          current: 1,
          lastActiveDate: now,
          lastLogin: now
        };
        await user.save();
      } else if (dayDifference === 0) {
        // Already active today -> update timestamp only
        user.streak.lastActiveDate = now;
        user.streak.lastLogin = now;
        await user.save();
      }
    } else {
      // First ever activity
      user.streak = { current: 1, lastActiveDate: now, lastLogin: now };
      await user.save();
    }

    // --- Data Aggregation for Frontend Progress Map ---
    // 1. Weekly Activity (Last 7 Days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivity = [];

    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      weeklyActivity.push({
        day: days[d.getDay()],
        dateString: d.toDateString(),
        minutes: 0,
        count: 0
      });
    }

    // Aggregate from activityLog (assuming user.activityLog exists and has timestamp)
    if (user.activityLog && user.activityLog.length > 0) {
      user.activityLog.forEach(log => {
        const logDate = new Date(log.timestamp).toDateString();
        const dayStat = weeklyActivity.find(w => w.dateString === logDate);
        if (dayStat) {
          dayStat.count += 1;

          // Realistic Weighting based on Action Type
          let minutesToAdd = 15; // Default (e.g., login/visit)

          if (log.action === 'studied_course') minutesToAdd = 30;
          else if (log.action === 'completed_lesson') minutesToAdd = 45;
          else if (log.action === 'coding_session') minutesToAdd = 25;
          else if (log.action === 'interview_attempt') minutesToAdd = 20;
          else if (log.action === 'typing_test') minutesToAdd = 10;
          else if (log.action === 'code_translation') minutesToAdd = 5; // Quick tool usage
          else if (log.action === 'created_resume') minutesToAdd = 20;
          else if (log.action === 'uploaded_certificate') minutesToAdd = 5;
          else if (log.action === 'pdf_tool_usage') minutesToAdd = 5;

          dayStat.minutes += minutesToAdd;
        }
      });
    }

    // 2. Skill Progress (Derived from Courses)
    // Group courses by "tags" or roughly by title keywords if no tags
    const skillMap = {};
    const defaultSkills = ['React', 'JavaScript', 'Node.js', 'Python', 'Java', 'DSA'];

    if (user.courses && user.courses.length > 0) {
      user.courses.forEach(course => {
        // Simple keyword matching for demo if no explicit category
        let matched = false;
        defaultSkills.forEach(skill => {
          if (course.title && course.title.toLowerCase().includes(skill.toLowerCase())) {
            if (!skillMap[skill]) skillMap[skill] = { total: 0, count: 0 };
            skillMap[skill].total += course.progress;
            skillMap[skill].count += 1;
            matched = true;
          }
        });
        // Fallback
        if (!matched) {
          if (!skillMap['General']) skillMap['General'] = { total: 0, count: 0 };
          skillMap['General'].total += course.progress;
          skillMap['General'].count += 1;
        }
      });
    }

    const processedSkills = Object.keys(skillMap).map(key => ({
      name: key,
      progress: Math.round(skillMap[key].total / skillMap[key].count),
      // Color logic
      color: (Math.round(skillMap[key].total / skillMap[key].count) > 75) ? 'bg-emerald-500' :
        (Math.round(skillMap[key].total / skillMap[key].count) > 40) ? 'bg-indigo-500' : 'bg-amber-500'
    })).sort((a, b) => b.progress - a.progress); // completed first

    // 3. Overall Progress
    const totalPossibleProgress = (user.courses.length * 100) || 100;
    const currentTotalProgress = user.courses.reduce((acc, curr) => acc + curr.progress, 0);
    const overallPercentage = user.courses.length > 0 ? Math.round((currentTotalProgress / totalPossibleProgress) * 100) : 0;

    // Attach these computed stats to the user object
    const userObj = user.toObject();
    userObj.dashboardStats = {
      weeklyActivity,
      skills: processedSkills,
      overallProgress: overallPercentage,
      totalCourses: user.courses.length
    };

    // --- Enhanced Stats from New Features ---
    // --- Enhanced Stats from New Features ---
    const interviewCount = await InterviewAttempt.countDocuments({ userId: req.user.id });
    const typingCount = await TypingTest.countDocuments({ userId: req.user.id });
    // Fetch latest typing WPM
    // const lastTyping = await TypingTest.findOne({ userId: req.user.id }).sort({ createdAt: -1 });

    // Calculate Points Influence
    // const points = user.gamification ? user.gamification.points : 0;

    // --- REALISTIC SKILL BREAKDOWN (No Static Data) ---
    // If user has no courses, skills will be empty or minimal, showing 0%.
    // We strictly use the `processedSkills` array calculated above from actual courses.
    // We enrich it with colors and icons if needed.

    // Force re-calculate processedSkills to be robust
    const realSkillMap = {};
    // Base skills to track (but only show if progress > 0)
    const trackedSkills = ['HTML', 'CSS', 'JavaScript', 'React', 'Backend', 'Python', 'Java', 'C++'];

    // 1. Initialize with 0
    trackedSkills.forEach(s => realSkillMap[s] = { total: 0, count: 0, bonus: 0 });

    // 2. Aggregate from Courses
    if (user.courses && user.courses.length > 0) {
      user.courses.forEach(course => {
        // Find matching skill category
        const title = course.title || "";
        let matched = false;
        trackedSkills.forEach(skill => {
          if (title.toLowerCase().includes(skill.toLowerCase())) {
            realSkillMap[skill].total += course.progress;
            realSkillMap[skill].count += 1;
            matched = true;
          }
        });
        // If "Web Development" or generic, split credit
        if (!matched && title.toLowerCase().includes('web')) {
          realSkillMap['HTML'].total += course.progress; realSkillMap['HTML'].count++;
          realSkillMap['CSS'].total += course.progress; realSkillMap['CSS'].count++;
        }
      });
    }

    // 3. Add Activity Bonus (Interviews/Typing)
    if (interviewCount > 0) {
      realSkillMap['JavaScript'].bonus += 5;
      realSkillMap['React'].bonus += 5;
      realSkillMap['Backend'].bonus += 10;
    }
    if (typingCount > 0) {
      realSkillMap['JavaScript'].bonus += 5; // Typing code helps syntax
    }

    // 4. Final Processing
    const finalSkills = trackedSkills.map(name => {
      const data = realSkillMap[name];
      let calculated = 0;
      if (data.count > 0) {
        calculated = Math.round(data.total / data.count);
      }
      // Add bonus but cap at 100
      calculated = Math.min(100, calculated + data.bonus);

      // Determine Color
      let color = 'bg-slate-400';
      if (calculated >= 80) color = 'bg-yellow-500';
      else if (calculated >= 60) color = 'bg-emerald-500';
      else if (calculated >= 40) color = 'bg-indigo-500';
      else if (calculated > 0) color = 'bg-blue-500';

      return { name, progress: calculated, color };
    }).filter(s => s.progress > 0) // ONLY show skills with >0 progress
      .sort((a, b) => b.progress - a.progress);

    // If absolutely no skills, show one placeholder saying "Start a Course"?
    // Actually, user wants "realistic", so empty is realistic.
    // But to avoid broken UI, we might keep an empty array or the fallback in frontend.
    userObj.dashboardStats.skills = finalSkills;

    // Add Gamification Stats to dashboardStats
    userObj.dashboardStats.gamification = user.gamification || { points: 0, level: 'Beginner', badges: [] };

    // Dynamic Recommendation
    let recTitle = "Start a New Course";
    let recSubtitle = "Explore our catalog to begin your journey.";
    let recLink = "/courses";

    const inProgress = user.courses.find(c => !c.completed && c.progress > 0);
    if (inProgress) {
      recTitle = `Continue "${inProgress.title}"`;
      recSubtitle = `You are ${inProgress.progress}% there! Keep going to earn your certificate.`;
      recLink = "/courses";
    } else if (interviewCount > 0 && interviewCount < 5) {
      recTitle = "Practice More Interviews";
      recSubtitle = "You've started strong. Try a new topic to broaden your skills.";
      recLink = "/practice";
    } else if (user.courses.length > 0 && !inProgress) {
      recTitle = "Take a Skill Assessment";
      recSubtitle = "Prove your mastery by taking a quiz on your completed topics.";
      recLink = "/quiz";
    }

    userObj.dashboardStats.recommendation = { title: recTitle, subtitle: recSubtitle, link: recLink };

    res.status(200).json(userObj);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Server error while fetching user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==========================
// UPDATE COURSE PROGRESS
// ==========================
exports.updateCourseProgress = async (req, res) => {
  const { courseId, title, progress, completed } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const courseIndex = user.courses.findIndex(c => c.courseId === courseId);
    if (courseIndex > -1) {
      user.courses[courseIndex].progress = progress;
      user.courses[courseIndex].completed = completed;
    } else {
      user.courses.push({ courseId, title, progress, completed });
    }

    // Log Activity for every study session
    user.activityLog.push({
      action: 'studied_course',
      details: `Studied: ${title}`,
      timestamp: new Date()
    });

    // Log Activity & Notification if completed
    if (completed) {
      user.activityLog.push({
        action: 'completed_lesson',
        details: `Completed course: ${title}`,
        timestamp: new Date()
      });
      user.notifications.push({
        message: `Congratulations! You completed the course: ${title}`,
        type: 'success',
        date: new Date()
      });
    }

    await user.save();
    res.status(200).json(user.courses);
  } catch (error) {
    res.status(500).json({ message: 'Error updating progress' });
  }
};

// ==========================
// SAVE RESUME
// ==========================
exports.saveResume = async (req, res) => {
  const { title } = req.body;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const user = await User.findById(req.user.id);
    user.savedResumes.push({
      title: title || (req.file ? req.file.originalname : 'Untitled Resume'),
      data: { fileUrl, type: req.file?.mimetype }
    });

    const resumeTitle = title || (req.file ? req.file.originalname : 'Untitled Resume');
    user.activityLog.push({
      action: 'created_resume',
      details: `Created resume: ${resumeTitle}`,
      timestamp: new Date()
    });
    user.notifications.push({
      message: `Resume saved successfully: ${resumeTitle}`,
      type: 'success',
      date: new Date()
    });

    await user.save();
    res.status(200).json(user.savedResumes);
  } catch (error) {
    res.status(500).json({ message: 'Error saving resume' });
  }
};

// ==========================
// UPDATE PROFILE
// ==========================
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      user.github = req.body.github || user.github;
      user.linkedin = req.body.linkedin || user.linkedin;
      user.twitter = req.body.twitter || user.twitter;

      // Handle File Upload or URL
      if (req.file) {
        user.avatar = `/uploads/${req.file.filename}`;
      } else if (req.body.avatar) {
        user.avatar = req.body.avatar;
      }

      if (req.body.password) user.password = req.body.password;

      const updatedUser = await user.save();
      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
        address: updatedUser.address,
        github: updatedUser.github,
        linkedin: updatedUser.linkedin,
        twitter: updatedUser.twitter,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// ==========================
// SAVE CERTIFICATE
// ==========================
exports.saveCertificate = async (req, res) => {
  const { title } = req.body;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const user = await User.findById(req.user.id);
    const certTitle = title || (req.file ? req.file.originalname : 'Untitled Certificate');
    user.certificates.push({
      title: certTitle,
      fileUrl
    });

    user.activityLog.push({
      action: 'uploaded_certificate',
      details: `Uploaded certificate: ${certTitle}`,
      timestamp: new Date()
    });
    user.notifications.push({
      message: `Certificate uploaded: ${certTitle}`,
      type: 'success',
      date: new Date()
    });

    await user.save();
    res.status(200).json(user.certificates);
  } catch (error) {
    res.status(500).json({ message: 'Error saving certificate' });
  }
};

// ==========================
// UPDATE CODING HOURS
// ==========================
exports.updateCodingHours = async (req, res) => {
  const { hours } = req.body;
  try {
    const user = await User.findById(req.user.id);
    user.codingHours = (user.codingHours || 0) + parseFloat(hours);

    // Log this activity so it shows up in the graph
    user.activityLog.push({
      action: 'coding_session',
      details: 'Coding Practice Session',
      timestamp: new Date()
    });

    await user.save();
    res.status(200).json({ codingHours: user.codingHours });
  } catch (error) {
    res.status(500).json({ message: 'Error updating coding hours' });
  }
};

// ==========================
// DELETE ASSETS
// ==========================
exports.deleteResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.savedResumes = user.savedResumes.filter(r => r._id.toString() !== req.params.id);
    await user.save();
    res.status(200).json(user.savedResumes);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting resume' });
  }
};

exports.deleteCertificate = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.certificates = user.certificates.filter(c => c._id.toString() !== req.params.id);
    await user.save();
    res.status(200).json(user.certificates);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting certificate' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    // Remove by _id (subdocument id)
    user.courses = user.courses.filter(c => c._id.toString() !== req.params.id);
    await user.save();
    res.status(200).json(user.courses);
  } catch (error) {
    res.status(500).json({ message: 'Error removing course' });
  }
};
