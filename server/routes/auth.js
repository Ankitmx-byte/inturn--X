const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { signup, login, getProfile, createDemoAccount, updateProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for resume uploads
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const router = express.Router();

// Validation rules
const signupValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Routes
router.post('/signup', signupValidation, signup);
router.post('/login', login);
router.post('/demo', createDemoAccount);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, uploadResume.single('resume'), updateProfile);

// OAuth availability check
router.get('/oauth/available', (req, res) => {
  res.json({
    github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    linkedin: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET)
  });
});

// OAuth routes - always register routes, check credentials inside handlers
// GitHub OAuth
router.get('/github', (req, res, next) => {
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
  } else {
    res.status(501).json({ error: 'GitHub OAuth is not configured' });
  }
});

router.get('/github/callback', (req, res, next) => {
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.authenticate('github', { failureRedirect: '/login' }, (err, user, info) => {
      if (err) {
        console.error('GitHub OAuth error:', err);
        return res.status(500).json({ error: 'Authentication failed', details: err.message });
      }
      if (!user) {
        console.error('GitHub OAuth: No user returned', info);
        return res.redirect('/login?error=oauth_failed');
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '7d'
      });
      res.redirect(`${process.env.CLIENT_URL || 'https://inturn-x.vercel.app'}/auth/callback?token=${token}&provider=github`);
    })(req, res, next);
  } else {
    res.status(501).json({ error: 'GitHub OAuth is not configured' });
  }
});

// Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '7d'
      });
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}&provider=google`);
    }
  );
} else {
  router.get('/google', (req, res) => {
    res.status(501).json({ error: 'Google OAuth is not configured' });
  });
  router.get('/google/callback', (req, res) => {
    res.status(501).json({ error: 'Google OAuth is not configured' });
  });
}

// LinkedIn OAuth
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  router.get('/linkedin', passport.authenticate('linkedin'));
  router.get('/linkedin/callback',
    passport.authenticate('linkedin', { failureRedirect: '/login' }),
    (req, res) => {
      const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '7d'
      });
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}&provider=linkedin`);
    }
  );
} else {
  router.get('/linkedin', (req, res) => {
    res.status(501).json({ error: 'LinkedIn OAuth is not configured' });
  });
  router.get('/linkedin/callback', (req, res) => {
    res.status(501).json({ error: 'LinkedIn OAuth is not configured' });
  });
}

module.exports = router;
