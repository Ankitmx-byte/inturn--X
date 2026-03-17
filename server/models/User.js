const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: function() {
      return !this.oauthProvider || this.oauthProvider === 'local';
    },
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.oauthProvider || this.oauthProvider === 'local';
    }
  },
  role: {
    type: String,
    enum: ['student', 'developer', 'mentor', 'recruiter'],
    default: 'student'
  },
  xp: {
    type: Number,
    default: 0
  },
  badges: [{
    type: String
  }],
  skills: [{
    type: String
  }],
  completedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  progress: {
    type: Map,
    of: Number, // courseId -> percentage
    default: new Map()
  },
  certificates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  }],
  uploadedCertificates: [{
    name: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resumeLink: {
    type: String,
    default: ''
  },
  resumeData: {
    personalInfo: {
      fullName: String,
      email: String,
      phone: String,
      location: String,
      summary: String
    },
    education: [{
      institution: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date,
      current: Boolean,
      description: String
    }],
    experience: [{
      company: String,
      position: String,
      location: String,
      startDate: Date,
      endDate: Date,
      current: Boolean,
      description: String
    }],
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      link: String,
      startDate: Date,
      endDate: Date
    }],
    skills: [{
      category: String,
      items: [String]
    }],
    certifications: [{
      name: String,
      issuer: String,
      date: Date,
      credentialId: String,
      link: String
    }]
  },
  bio: {
    type: String,
    maxlength: 500
  },
  github: {
    type: String
  },
  linkedin: {
    type: String
  },
  portfolio: {
    type: String
  },
  location: {
    type: String
  },
  // OAuth fields
  githubId: {
    type: String,
    sparse: true
  },
  googleId: {
    type: String,
    sparse: true
  },
  linkedinId: {
    type: String,
    sparse: true
  },
  oauthProvider: {
    type: String,
    enum: ['local', 'github', 'google', 'linkedin']
  },
  avatar: {
    type: String
  },
  // Battle Arena fields
  rating: {
    type: Number,
    default: 1200
  },
  battleStats: {
    totalBattles: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    draws: {
      type: Number,
      default: 0
    },
    winRate: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    bestStreak: {
      type: Number,
      default: 0
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in seconds
    },
    averageSolveTime: {
      type: Number,
      default: 0 // in seconds
    }
  },
  rank: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master', 'Grandmaster'],
    default: 'Beginner'
  },
  // Activity tracking
  lastActive: {
    type: Date,
    default: Date.now
  },
  activityLog: [{
    type: {
      type: String,
      enum: ['course_completed', 'project_submitted', 'battle_won', 'quiz_completed', 'login']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  // Learning streak
  streakDays: {
    type: Number,
    default: 0
  },
  lastStreakDate: {
    type: Date
  },
  // Time tracking
  totalTimeSpent: {
    type: Number,
    default: 0 // in hours
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
