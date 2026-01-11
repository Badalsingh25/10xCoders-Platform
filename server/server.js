const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const colors = require('colors');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const port = process.env.PORT || 5000;
const mongoose = require('mongoose');

const configurePassport = require('./config/passport');
const passport = require('passport');
const session = require('express-session');

// Connect to database
connectDB();

const fs = require('fs');

const app = express();
app.use((req, res, next) => {
  const logMsg = `[SERVER_HIT] ${new Date().toISOString()} ${req.method} ${req.url}\n`;
  console.log(logMsg.trim());
  try { fs.appendFileSync('debug.log', logMsg); } catch (e) { /* ignore */ }
  next();
});

// Passport Config
configurePassport();

// Session middleware (required for some passport strategies)
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const upload = multer({ storage: multer.memoryStorage() });

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:", "https:", "*"],
      "media-src": ["'self'", "data:", "blob:", "https:", "*"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://www.youtube.com", "https://s.ytimg.com"],
      "connect-src": ["'self'", "https:", "ws:", "http://localhost:5001"],
      "frame-src": ["'self'", "https://www.youtube.com"],
      "worker-src": ["'self'", "blob:", "https://cdnjs.cloudflare.com"]
    }
  }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5001',
  'https://10xcoders.netlify.app',
  'https://www.10xcoders.netlify.app',
  'https://10xcoders-platform.netlify.app',
  'https://www.10xcoders-platform.netlify.app',
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin); // Log blocked origins for debugging
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve static uploads
// Serve static uploads (Check 'uploads' first, then 'public/uploads')
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path, stat) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  setHeaders: (res, path, stat) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Routes
app.use('/api/todos', require('./routes/todoRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/judge', require('./routes/judgeRoutes'));
app.use('/api/convert', require('./routes/convertRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/quiz', require('./routes/quizRoutes'));
app.use('/api/community', require('./routes/communityRoutes'));
app.use('/api/features', require('./routes/featureRoutes'));
app.use('/', require('./routes/authRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) =>
    res.sendFile(
      path.resolve(__dirname, '../', 'client', 'build', 'index.html')
    )
  );
} else {
  app.get('/', (req, res) => res.send('API running'));
}

// Error handling middleware
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Start server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected'.green);
  })
  .catch((err) => {
    console.error('MongoDB connection error:'.red, err);
    process.exit(1);
  }); 
