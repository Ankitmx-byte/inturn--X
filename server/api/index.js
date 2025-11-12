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
  // Skip DB connection for health check and debug routes to avoid timeout
  if (req.path === '/api/health' || req.path === '/api/debug/routes') {
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

// Routes - Keep /api prefix for Vercel compatibility
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
    version: '1.1.0-fresh-deployment',
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

// Debug endpoint to list all routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes });
});

// Debug endpoint to check environment variables
app.get('/api/debug/env', (req, res) => {
  res.json({
    github: {
      hasClientId: !!process.env.GITHUB_CLIENT_ID,
      hasClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
      clientIdLength: process.env.GITHUB_CLIENT_ID ? process.env.GITHUB_CLIENT_ID.length : 0,
      clientIdPrefix: process.env.GITHUB_CLIENT_ID ? process.env.GITHUB_CLIENT_ID.substring(0, 5) : 'N/A'
    },
    google: {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
    },
    linkedin: {
      hasClientId: !!process.env.LINKEDIN_CLIENT_ID,
      hasClientSecret: !!process.env.LINKEDIN_CLIENT_SECRET
    },
    other: {
      hasClientUrl: !!process.env.CLIENT_URL,
      clientUrl: process.env.CLIENT_URL,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET
    }
  });
});

// Export the Express app as a serverless function
module.exports = app;

