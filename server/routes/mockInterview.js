const express = require('express');
const router = express.Router();
const mockInterviewController = require('../controllers/mockInterviewController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get available personas
router.get('/personas', mockInterviewController.getPersonas);

// Start new interview
router.post('/start', mockInterviewController.startInterview);

// Get interview details
router.get('/:id', mockInterviewController.getInterview);

// Get next question
router.post('/:id/next-question', mockInterviewController.getNextQuestion);

// Submit answer
router.post('/:id/answer', mockInterviewController.submitAnswer);

// Submit code
router.post('/:id/code', mockInterviewController.submitCode);

// End interview and get evaluation
router.post('/:id/end', mockInterviewController.endInterview);

// Get user's interview history
router.get('/user/history', mockInterviewController.getHistory);

// Get coding problem
router.get('/coding/problem', mockInterviewController.getCodingProblem);

// Voice assistant - Generate speech
router.post('/speak', mockInterviewController.speak);

module.exports = router;