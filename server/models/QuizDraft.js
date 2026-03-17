const mongoose = require('mongoose');

const quizDraftSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  language: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  questionId: {
    type: String,
    required: true
  },
  code: {
    type: String,
    default: ''
  },
  answer: {
    type: mongoose.Schema.Types.Mixed
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  lastSavedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one draft per user-language-level-question
quizDraftSchema.index({ userId: 1, language: 1, level: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('QuizDraft', quizDraftSchema);