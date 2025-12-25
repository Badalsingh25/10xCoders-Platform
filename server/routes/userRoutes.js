const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  registerUser,
  loginUser,
  getMe,
  updateCourseProgress,
  saveResume,
  updateProfile,
  saveCertificate,
  updateCodingHours,
  sendOtp,
  verifyOtp,
  resetPassword,
  markNotificationsRead,
  deleteResume,
  deleteCertificate,
  deleteCourse
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\\s+/g, '-')}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

console.log('[USER_ROUTES] Loaded');
router.post('/register', (req, res, next) => {
  console.log('[USER_ROUTES] POST /register hit');
  next();
}, registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/course-progress', protect, updateCourseProgress);
router.post('/resume', protect, upload.single('file'), saveResume);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.post('/certificate', protect, upload.single('file'), saveCertificate);
router.put('/coding-hours', protect, updateCodingHours);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.put('/notifications/read', protect, markNotificationsRead);
router.delete('/resume/:id', protect, deleteResume);
router.delete('/certificate/:id', protect, deleteCertificate);
router.delete('/course/:id', protect, deleteCourse);

module.exports = router; 