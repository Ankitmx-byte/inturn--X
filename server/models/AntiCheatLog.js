const mongoose = require('mongoose');

const antiCheatLogSchema = new mongoose.Schema({
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
  eventType: {
    type: String,
    enum: [
      'tab_switch',
      'window_blur',
      'visibility_change',
      'resize',
      'devtools_open',
      'copy_attempt',
      'paste_attempt',
      'cut_attempt',
      'context_menu',
      'camera_blocked',
      'multiple_faces',
      'no_face_detected',
      'enabled',
      'disabled'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  penaltyPoints: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
antiCheatLogSchema.index({ userId: 1, sessionId: 1 });
antiCheatLogSchema.index({ timestamp: -1 });
antiCheatLogSchema.index({ sessionType: 1, eventType: 1 });

module.exports = mongoose.model('AntiCheatLog', antiCheatLogSchema);