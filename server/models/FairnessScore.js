const mongoose = require('mongoose');

const fairnessScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  sessionType: {
    type: String,
    enum: ['battle', 'quiz', 'mock-interview', 'course-test'],
    required: true
  },
  initialScore: {
    type: Number,
    default: 100
  },
  currentScore: {
    type: Number,
    default: 100
  },
  penalties: [{
    eventType: String,
    points: Number,
    timestamp: Date,
    description: String
  }],
  isDisqualified: {
    type: Boolean,
    default: false
  },
  disqualifiedAt: Date,
  disqualificationReason: String,
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date
}, {
  timestamps: true
});

// Compound index for efficient queries
fairnessScoreSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
fairnessScoreSchema.index({ sessionType: 1, isDisqualified: 1 });

module.exports = mongoose.model('FairnessScore', fairnessScoreSchema);