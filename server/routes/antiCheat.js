const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const antiCheatService = require('../services/antiCheatService');

// Initialize anti-cheat session
router.post('/init', auth, async (req, res) => {
  try {
    const { sessionId, sessionType } = req.body;

    const fairnessScore = await antiCheatService.initializeSession(
      req.user.id,
      sessionId,
      sessionType
    );

    res.json({
      success: true,
      fairnessScore
    });
  } catch (error) {
    console.error('Init anti-cheat error:', error);
    res.status(500).json({ message: 'Failed to initialize anti-cheat' });
  }
});

// Log anti-cheat event
router.post('/log', auth, async (req, res) => {
  try {
    const { sessionId, sessionType, eventType, metadata } = req.body;

    const log = await antiCheatService.logEvent(
      req.user.id,
      sessionId,
      sessionType,
      eventType,
      metadata
    );

    const fairnessScore = await antiCheatService.getFairnessScore(
      req.user.id,
      sessionId
    );

    res.json({
      success: true,
      log,
      fairnessScore
    });
  } catch (error) {
    console.error('Log anti-cheat event error:', error);
    res.status(500).json({ message: 'Failed to log event' });
  }
});

// Get fairness score
router.get('/fairness/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const fairnessScore = await antiCheatService.getFairnessScore(
      req.user.id,
      sessionId
    );

    if (!fairnessScore) {
      return res.status(404).json({ message: 'Fairness score not found' });
    }

    res.json(fairnessScore);
  } catch (error) {
    console.error('Get fairness score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get session logs
router.get('/logs/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const logs = await antiCheatService.getSessionLogs(sessionId);

    res.json(logs);
  } catch (error) {
    console.error('Get session logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// End anti-cheat session
router.post('/end', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    const fairnessScore = await antiCheatService.endSession(
      req.user.id,
      sessionId
    );

    res.json({
      success: true,
      fairnessScore
    });
  } catch (error) {
    console.error('End anti-cheat session error:', error);
    res.status(500).json({ message: 'Failed to end session' });
  }
});

module.exports = router;