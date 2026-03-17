const AntiCheatLog = require('../models/AntiCheatLog');
const FairnessScore = require('../models/FairnessScore');

class AntiCheatService {
  constructor() {
    // Penalty points for different violation types
    this.penalties = {
      tab_switch: 15,
      window_blur: 15,
      visibility_change: 10,
      resize: 5,
      devtools_open: 20,
      copy_attempt: 10,
      paste_attempt: 10,
      cut_attempt: 10,
      context_menu: 5,
      camera_blocked: 40,
      multiple_faces: 50,
      no_face_detected: 30
    };

    // Severity levels
    this.severityMap = {
      tab_switch: 'high',
      window_blur: 'high',
      visibility_change: 'medium',
      resize: 'low',
      devtools_open: 'critical',
      copy_attempt: 'medium',
      paste_attempt: 'medium',
      cut_attempt: 'medium',
      context_menu: 'low',
      camera_blocked: 'critical',
      multiple_faces: 'critical',
      no_face_detected: 'high'
    };

    this.DISQUALIFICATION_THRESHOLD = 40;
  }

  async initializeSession(userId, sessionId, sessionType) {
    try {
      const fairnessScore = new FairnessScore({
        userId,
        sessionId,
        sessionType,
        initialScore: 100,
        currentScore: 100,
        penalties: [],
        isDisqualified: false
      });

      await fairnessScore.save();
      return fairnessScore;
    } catch (error) {
      console.error('Error initializing anti-cheat session:', error);
      throw error;
    }
  }

  async logEvent(userId, sessionId, sessionType, eventType, metadata = {}) {
    try {
      const penaltyPoints = this.penalties[eventType] || 0;
      const severity = this.severityMap[eventType] || 'medium';

      // Create log entry
      const log = new AntiCheatLog({
        userId,
        sessionId,
        sessionType,
        eventType,
        severity,
        penaltyPoints,
        metadata
      });

      await log.save();

      // Update fairness score if penalty exists
      if (penaltyPoints > 0) {
        await this.updateFairnessScore(userId, sessionId, eventType, penaltyPoints);
      }

      return log;
    } catch (error) {
      console.error('Error logging anti-cheat event:', error);
      throw error;
    }
  }

  async updateFairnessScore(userId, sessionId, eventType, penaltyPoints) {
    try {
      const fairnessScore = await FairnessScore.findOne({ userId, sessionId });

      if (!fairnessScore) {
        console.error('Fairness score not found for session:', sessionId);
        return null;
      }

      // Add penalty
      fairnessScore.penalties.push({
        eventType,
        points: penaltyPoints,
        timestamp: new Date(),
        description: this.getEventDescription(eventType)
      });

      // Update current score
      fairnessScore.currentScore = Math.max(0, fairnessScore.currentScore - penaltyPoints);

      // Check for disqualification
      if (fairnessScore.currentScore < this.DISQUALIFICATION_THRESHOLD && !fairnessScore.isDisqualified) {
        fairnessScore.isDisqualified = true;
        fairnessScore.disqualifiedAt = new Date();
        fairnessScore.disqualificationReason = `Fairness score dropped below ${this.DISQUALIFICATION_THRESHOLD}`;
      }

      await fairnessScore.save();
      return fairnessScore;
    } catch (error) {
      console.error('Error updating fairness score:', error);
      throw error;
    }
  }

  async getFairnessScore(userId, sessionId) {
    try {
      return await FairnessScore.findOne({ userId, sessionId });
    } catch (error) {
      console.error('Error fetching fairness score:', error);
      return null;
    }
  }

  async getSessionLogs(sessionId) {
    try {
      return await AntiCheatLog.find({ sessionId }).sort({ timestamp: -1 });
    } catch (error) {
      console.error('Error fetching session logs:', error);
      return [];
    }
  }

  async endSession(userId, sessionId) {
    try {
      const fairnessScore = await FairnessScore.findOne({ userId, sessionId });
      if (fairnessScore) {
        fairnessScore.endedAt = new Date();
        await fairnessScore.save();
      }
      return fairnessScore;
    } catch (error) {
      console.error('Error ending anti-cheat session:', error);
      throw error;
    }
  }

  getEventDescription(eventType) {
    const descriptions = {
      tab_switch: 'Switched to another tab',
      window_blur: 'Window lost focus',
      visibility_change: 'Page visibility changed',
      resize: 'Window resized',
      devtools_open: 'Developer tools detected',
      copy_attempt: 'Attempted to copy content',
      paste_attempt: 'Attempted to paste content',
      cut_attempt: 'Attempted to cut content',
      context_menu: 'Right-click menu opened',
      camera_blocked: 'Camera access blocked',
      multiple_faces: 'Multiple faces detected',
      no_face_detected: 'No face detected in camera'
    };

    return descriptions[eventType] || 'Unknown event';
  }
}

module.exports = new AntiCheatService();