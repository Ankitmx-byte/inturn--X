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

// Configure multer for certificate uploads
const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/certificates/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadCertificate = multer({
  storage: certificateStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
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
router.post('/upload-certificate', auth, uploadCertificate.single('certificate'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const certificateData = {
      name: req.body.name || req.file.originalname,
      fileUrl: `/uploads/certificates/${req.file.filename}`,
      uploadedAt: new Date()
    };

    user.uploadedCertificates.push(certificateData);
    await user.save();

    res.json({
      message: 'Certificate uploaded successfully',
      certificate: certificateData
    });
  } catch (error) {
    console.error('Certificate upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/certificate/:index', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const index = parseInt(req.params.index);
    if (index < 0 || index >= user.uploadedCertificates.length) {
      return res.status(400).json({ message: 'Invalid certificate index' });
    }

    user.uploadedCertificates.splice(index, 1);
    await user.save();

    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Certificate delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/resume-data', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.resumeData = req.body.resumeData;
    await user.save();

    res.json({
      message: 'Resume data saved successfully',
      resumeData: user.resumeData
    });
  } catch (error) {
    console.error('Resume data save error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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
  console.log('GitHub OAuth route hit');
  console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? 'SET' : 'NOT SET');
  console.log('GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? 'SET' : 'NOT SET');

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    console.log('Authenticating with GitHub...');
    passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
  } else {
    console.error('GitHub OAuth not configured - missing credentials');
    res.status(501).json({
      error: 'GitHub OAuth is not configured',
      debug: {
        hasClientId: !!process.env.GITHUB_CLIENT_ID,
        hasClientSecret: !!process.env.GITHUB_CLIENT_SECRET
      }
    });
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
