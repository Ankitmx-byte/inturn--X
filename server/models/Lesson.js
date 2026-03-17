const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'theory', 'quiz', 'coding', 'final-test'],
    required: true
  },
  // Video lesson fields
  videoUrl: {
    type: String
  },
  videoType: {
    type: String,
    enum: ['mp4', 'hls', 'youtube'],
    default: 'mp4'
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  // Theory lesson fields
  content: {
    type: String // Markdown content
  },
  // Quiz lesson fields
  questions: [{
    question: String,
    type: {
      type: String,
      enum: ['mcq', 'true-false', 'coding']
    },
    options: [String],
    correctAnswer: mongoose.Schema.Types.Mixed,
    explanation: String,
    points: {
      type: Number,
      default: 10
    }
  }],
  passingScore: {
    type: Number,
    default: 70
  },
  // Coding lesson fields
  codingProblem: {
    title: String,
    description: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    starterCode: {
      type: Map,
      of: String // language -> starter code
    },
    testCases: [{
      input: String,
      expectedOutput: String,
      isHidden: {
        type: Boolean,
        default: false
      }
    }],
    constraints: [String],
    hints: [String]
  },
  // Unlock requirements
  isLocked: {
    type: Boolean,
    default: true
  },
  requiredLessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  xpReward: {
    type: Number,
    default: 50
  }
}, {
  timestamps: true
});

// Compound index for course lessons
lessonSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);