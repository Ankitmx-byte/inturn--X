// Vercel serverless function entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');

// Initialize database
const { connectDB } = require('../database');

// Import routes
const authRoutes = require('../routes/auth');
const coursesRoutes = require('../routes/courses');
const battlesRoutes = require('../routes/battles');
const aiRoutes = require('../routes/ai');
const projectsRoutes = require('../routes/projects');
const internshipsRoutes = require('../routes/internships');
const adminRoutes = require('../routes/admin');
const usersRoutes = require('../routes/users');
const quizRoutes = require('../routes/quiz');
const codeRoutes = require('../routes/code');
const leaderboardRoutes = require('../routes/leaderboard');

// Initialize Passport
require('../config/passport');

const app = express();

// Connect to database (with connection pooling for serverless)
let dbConnected = false;
let dbConnectionPromise = null;

const ensureDbConnection = async () => {
  if (dbConnected) {
    return true;
  }

  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB()
      .then(() => {
        dbConnected = true;
        console.log('Database connected successfully');
        return true;
      })
      .catch((error) => {
        console.error('Database connection error:', error.message);
        dbConnectionPromise = null; // Reset so it can retry
        return false;
      });
  }

  return dbConnectionPromise;
};

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:5173",
    "https://*.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Ensure DB connection before handling requests (non-blocking for health check)
app.use(async (req, res, next) => {
  // Skip DB connection for health check to avoid timeout
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  try {
    await ensureDbConnection();
    next();
  } catch (error) {
    console.error('DB connection middleware error:', error);
    next(); // Continue even if DB connection fails
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/battles', battlesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/internships', internshipsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'InturnX Server is running on Vercel',
    version: '1.0.2-timeout-fix',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasSessionSecret: !!process.env.SESSION_SECRET
    },
    oauth: {
      github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      linkedin: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET)
    }
  });
});

// Export the Express app as a serverless function
module.exports = app;

