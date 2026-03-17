const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedModules: [{
    moduleIndex: Number,
    completedAt: {
      type: Date,
      default: Date.now
    },
    score: Number // for quizzes
  }],
  currentModule: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  xpEarned: {
    type: Number,
    default: 0
  },
  quizScores: [{
    quizId: String,
    score: Number,
    maxScore: Number,
    completedAt: Date
  }],
  type: {
    type: String,
    enum: ['course', 'quiz', 'project'],
    default: 'course'
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  projectSubmitted: {
    type: Boolean,
    default: false
  },
  projectScore: Number,
  certificateEarned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure one progress per user-course
progressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
