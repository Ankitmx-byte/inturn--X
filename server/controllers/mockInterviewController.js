const interviewService = require('../services/interviewService');
const MockInterview = require('../models/MockInterview');
const voiceAssistant = require('../services/voiceAssistant');

class MockInterviewController {
  // Get all available personas
  async getPersonas(req, res) {
    try {
      const personas = await interviewService.getAllPersonas();
      res.json({ personas });
    } catch (error) {
      console.error('Get personas error:', error);
      res.status(500).json({ error: 'Failed to load personas' });
    }
  }

  // Start a new interview
  async startInterview(req, res) {
    try {
      const userId = req.user.id;
      const { personaKey, difficulty, types } = req.body;

      if (!personaKey || !difficulty || !types || types.length === 0) {
        return res.status(400).json({ 
          error: 'Missing required fields: personaKey, difficulty, types' 
        });
      }

      const interview = await interviewService.startInterview(userId, {
        personaKey,
        difficulty,
        types
      });

      res.json({ 
        interview: {
          id: interview._id,
          persona: interview.persona,
          difficulty: interview.difficulty,
          types: interview.type,
          transcript: interview.transcript
        }
      });
    } catch (error) {
      console.error('Start interview error:', error);
      res.status(500).json({ error: error.message || 'Failed to start interview' });
    }
  }

  // Get interview details
  async getInterview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const interview = await MockInterview.findOne({ 
        _id: id, 
        userId 
      });

      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      res.json({ interview });
    } catch (error) {
      console.error('Get interview error:', error);
      res.status(500).json({ error: 'Failed to get interview' });
    }
  }

  // Get next question
  async getNextQuestion(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const interview = await MockInterview.findOne({ _id: id, userId });
      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      const result = await interviewService.getNextQuestion(id);
      res.json(result);
    } catch (error) {
      console.error('Get next question error:', error);
      res.status(500).json({ error: error.message || 'Failed to get next question' });
    }
  }

  // Submit answer
  async submitAnswer(req, res) {
    try {
      const { id } = req.params;
      const { answer } = req.body;
      const userId = req.user.id;

      if (!answer || answer.trim().length === 0) {
        return res.status(400).json({ error: 'Answer is required' });
      }

      // Verify ownership
      const interview = await MockInterview.findOne({ _id: id, userId });
      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      const result = await interviewService.submitAnswer(id, answer);
      res.json(result);
    } catch (error) {
      console.error('Submit answer error:', error);
      res.status(500).json({ error: error.message || 'Failed to submit answer' });
    }
  }

  // Submit code
  async submitCode(req, res) {
    try {
      const { id } = req.params;
      const { code, language, testcases } = req.body;
      const userId = req.user.id;

      if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required' });
      }

      // Verify ownership
      const interview = await MockInterview.findOne({ _id: id, userId });
      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      const results = await interviewService.submitCode(id, {
        code,
        language,
        testcases: testcases || []
      });

      res.json(results);
    } catch (error) {
      console.error('Submit code error:', error);
      res.status(500).json({ error: error.message || 'Failed to execute code' });
    }
  }

  // End interview and get evaluation
  async endInterview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const interview = await MockInterview.findOne({ _id: id, userId });
      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      const result = await interviewService.endInterview(id, userId);
      res.json(result);
    } catch (error) {
      console.error('End interview error:', error);
      res.status(500).json({ error: error.message || 'Failed to end interview' });
    }
  }

  // Get user's interview history
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;

      const interviews = await interviewService.getUserInterviews(userId, limit);
      res.json({ interviews });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({ error: 'Failed to get interview history' });
    }
  }

  // Get coding problem
  async getCodingProblem(req, res) {
    try {
      const { difficulty, type } = req.query;
      const problem = interviewService.getCodingProblem(
        difficulty || 'easy',
        type || 'dsa'
      );
      res.json({ problem });
    } catch (error) {
      console.error('Get coding problem error:', error);
      res.status(500).json({ error: 'Failed to get coding problem' });
    }
  }

  // Generate speech for text
  async speak(req, res) {
    try {
      const { text, personaKey } = req.body;
      const userId = req.user.id;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text is required' });
      }

      // Limit text length for performance
      if (text.length > 1000) {
        return res.status(400).json({ error: 'Text too long (max 1000 characters)' });
      }

      const audioData = await voiceAssistant.speak(text, personaKey || 'rahul');
      
      res.json({
        success: true,
        audio: audioData
      });
    } catch (error) {
      console.error('Voice generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate voice',
        fallback: true
      });
    }
  }
}

module.exports = new MockInterviewController();