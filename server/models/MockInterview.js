const mongoose = require('mongoose');

const TranscriptEntrySchema = new mongoose.Schema({
  role: { type: String, enum: ['ai', 'user'], required: true },
  text: { type: String, required: true },
  ts: { type: Date, default: Date.now }
}, { _id: false });

const CodingResultSchema = new mongoose.Schema({
  input: { type: String },
  output: { type: String },
  expected: { type: String },
  passed: { type: Boolean }
}, { _id: false });

const BodyLanguageAnalysisSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  posture: {
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['good', 'fair', 'poor', 'neutral'], default: 'neutral' },
    feedback: { type: String, default: '' }
  },
  eyeContact: {
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['good', 'fair', 'poor', 'neutral'], default: 'neutral' },
    feedback: { type: String, default: '' }
  },
  facialExpression: {
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['good', 'fair', 'poor', 'neutral'], default: 'neutral' },
    feedback: { type: String, default: '' }
  },
  headPosition: {
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['good', 'fair', 'poor', 'neutral'], default: 'neutral' },
    feedback: { type: String, default: '' }
  },
  overallPresence: {
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['excellent', 'good', 'fair', 'poor', 'neutral'], default: 'neutral' }
  }
}, { _id: false });

const MockInterviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  persona: {
    key: { type: String, required: true },
    name: { type: String, required: true }
  },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  type: { type: [String], default: [] },
  transcript: { type: [TranscriptEntrySchema], default: [] },
  coding: {
    language: { type: String },
    code: { type: String },
    testcases: { type: [{ input: String, expected: String }], default: [] },
    results: { type: [CodingResultSchema], default: [] },
    runtime: { type: Number },
    passCount: { type: Number, default: 0 },
    failCount: { type: Number, default: 0 }
  },
  bodyLanguage: {
    enabled: { type: Boolean, default: false },
    analyses: { type: [BodyLanguageAnalysisSchema], default: [] },
    summary: {
      avgPosture: { type: Number, default: 0 },
      avgEyeContact: { type: Number, default: 0 },
      avgExpression: { type: Number, default: 0 },
      avgHeadPosition: { type: Number, default: 0 },
      avgOverallPresence: { type: Number, default: 0 },
      totalAnalyses: { type: Number, default: 0 }
    }
  },
  evaluation: {
    overallScore: { type: Number, default: 0 },
    sections: {
      hr: { type: Number, default: 0 },
      technical: { type: Number, default: 0 },
      dsa: { type: Number, default: 0 },
      systemDesign: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      coding: { type: Number, default: 0 },
      bodyLanguage: { type: Number, default: 0 }
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    confidence: { type: Number, default: 0 },
    analysis: { type: String, default: '' }
  },
  pdfUrl: { type: String, default: '' }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

MockInterviewSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('MockInterview', MockInterviewSchema);
