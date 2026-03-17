const mongoose = require('mongoose');

const quizProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: ['javascript', 'python', 'cpp', 'java', 'c', 'go', 'kotlin', 'rust', 'typescript', 'swift']
  },
  currentLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 100
  },
  completedLevels: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  scores: {
    type: Map,
    of: Number,
    default: {}
  },
  totalScore: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  averageTime: {
    type: Number,
    default: 0
  },
  lifelinesUsed: {
    fifty_fifty: { type: Number, default: 0 },
    swap_question: { type: Number, default: 0 }
  },
  coins: {
    type: Number,
    default: 100
  },
  badges: [{
    type: String,
    enum: ['first_level', 'level_10', 'level_25', 'level_50', 'level_100', 'speed_demon', 'accuracy_master']
  }],
  lastPlayed: {
    type: Date,
    default: Date.now
  },
  streak: {
    type: Number,
    default: 0
  },
  solvedQuestions: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
quizProgressSchema.index({ userId: 1, language: 1 }, { unique: true });

module.exports = mongoose.model('QuizProgress', quizProgressSchema);
