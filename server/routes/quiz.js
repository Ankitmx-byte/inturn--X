const express = require('express');
const router = express.Router();
const QuizProgress = require('../models/QuizProgress');
const QuizSubmission = require('../models/QuizSubmission');
const QuizDraft = require('../models/QuizDraft');
const { QUIZ_BANK, LANGUAGES, getQuestionsForLevel } = require('../data/quizBank');
const { auth } = require('../middleware/auth');
const judge0Service = require('../services/judge0Service');

// Get user progress for a language
router.get('/progress/:language', auth, async (req, res) => {
  try {
    const { language } = req.params;

    console.log(`📊 Fetching progress for user ${req.user.id}, language: ${language}`);

    const progress = await QuizProgress.findOne({
      userId: req.user.id,
      language
    });

    if (!progress) {
      console.log(`⚠️ No progress found for ${language}, returning defaults`);
      return res.json({
        currentLevel: 1,
        completedLevels: 0,
        scores: {},
        totalScore: 0,
        accuracy: 0,
        averageTime: 0,
        coins: 100,
        badges: [],
        lifelinesUsed: { fifty_fifty: 0, swap_question: 0 },
        solvedQuestions: []
      });
    }

    console.log(`✅ Progress found: Level ${progress.currentLevel}, Completed: ${progress.completedLevels}`);

    // Convert to plain object and ensure all fields are present
    const progressData = {
      currentLevel: progress.currentLevel,
      completedLevels: progress.completedLevels,
      scores: progress.scores,
      totalScore: progress.totalScore,
      accuracy: progress.accuracy,
      averageTime: progress.averageTime,
      coins: progress.coins,
      badges: progress.badges,
      lifelinesUsed: progress.lifelinesUsed,
      solvedQuestions: progress.solvedQuestions,
      lastPlayed: progress.lastPlayed
    };

    res.json(progressData);
  } catch (error) {
    console.error('❌ Get progress error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get quiz question for specific language and level
// FIXED: Now correctly maps Level N → Question N
router.get('/:language/:level', auth, async (req, res) => {
  try {
    const { language, level } = req.params;
    const levelNum = parseInt(level);

    if (!LANGUAGES.find(l => l.key === language)) {
      return res.status(400).json({ message: 'Invalid language' });
    }

    if (levelNum < 1 || levelNum > 100) {
      return res.status(400).json({ message: 'Invalid level' });
    }

    // Check user progress
    let progress = await QuizProgress.findOne({
      userId: req.user.id,
      language
    });

    if (!progress) {
      progress = new QuizProgress({
        userId: req.user.id,
        language,
        currentLevel: 1,
        completedLevels: 0
      });
      await progress.save();
    }

    // Check if level is unlocked (can only access current level or completed levels)
    if (levelNum > progress.completedLevels + 1) {
      return res.status(403).json({
        message: 'Level not unlocked yet',
        unlockedUntil: progress.completedLevels + 1
      });
    }

    // FIXED: Get the exact question for this level (Level N → Question N)
    const levelQuestions = getQuestionsForLevel(language, levelNum);
    if (!levelQuestions || levelQuestions.length === 0) {
      return res.status(404).json({ message: 'Questions not available for this level' });
    }

    // Check if this level is already completed
    if (levelNum <= progress.completedLevels) {
      // Level already completed, redirect to next level
      return res.status(200).json({
        message: 'Level already completed! Moving to next level.',
        levelComplete: true,
        nextLevel: progress.currentLevel
      });
    }

    // Always use the first question for consistency (Level N → Question N)
    const question = levelQuestions[0];

    // Determine question type based on level
    let questionType = 'mcq';
    let timeLimit = 30;
    let hasTimer = true;

    if (levelNum >= 1 && levelNum <= 30) {
      questionType = 'mcq';
      timeLimit = 30;
    } else if (levelNum >= 31 && levelNum <= 60) {
      questionType = 'output_prediction';
      timeLimit = 60;
    } else if (levelNum >= 61 && levelNum <= 85) {
      questionType = 'short_code';
      timeLimit = 300; // 5 minutes
    } else if (levelNum >= 86) {
      questionType = 'full_problem';
      timeLimit = null; // Unlimited
      hasTimer = false;
    }

    res.json({
      question: {
        ...question,
        type: questionType,
        level: levelNum,
        language,
        timeLimit,
        hasTimer
      },
      progress: {
        currentLevel: progress.currentLevel,
        completedLevels: progress.completedLevels,
        coins: progress.coins,
        lifelinesUsed: progress.lifelinesUsed,
        solvedQuestions: progress.solvedQuestions,
        totalScore: progress.totalScore,
        accuracy: progress.accuracy
      }
    });

  } catch (error) {
    console.error('Get quiz question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit quiz answer
// FIXED: Proper progress tracking and real-time updates
router.post('/submit', auth, async (req, res) => {
  try {
    const { language, level, questionId, answer, timeTaken, lifelineUsed, code } = req.body;

    console.log('📝 Quiz Submit Request:', {
      userId: req.user.id,
      language,
      level,
      questionId,
      answer,
      timeTaken
    });

    // Validate input
    if (!language || !level || !questionId || answer === undefined || timeTaken === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const levelNum = parseInt(level);

    // Get question from quiz bank to check answer
    const levelQuestions = getQuestionsForLevel(language, levelNum);
    if (!levelQuestions) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const question = levelQuestions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Determine question type based on level
    let questionType = 'mcq';
    if (levelNum >= 31 && levelNum <= 60) {
      questionType = 'output_prediction';
    } else if (levelNum >= 61 && levelNum <= 85) {
      questionType = 'short_code';
    } else if (levelNum >= 86) {
      questionType = 'full_problem';
    }

    // Check answer
    let isCorrect = false;
    let testCasesPassed = 0;
    let totalTestCases = 0;

    if (questionType === 'mcq') {
      isCorrect = parseInt(answer, 10) === question.answerIndex;
    } else if (questionType === 'output_prediction') {
      // For output prediction, compare strings (case insensitive, trimmed)
      isCorrect = answer.toString().toLowerCase().trim() === question.expectedOutput?.toLowerCase().trim();
    } else if (questionType === 'short_code' || questionType === 'full_problem') {
      // For coding questions, we need to run test cases
      if (question.testCases && question.testCases.length > 0) {
        const result = await judge0Service.executeWithTestCases(
          code,
          language,
          question.testCases,
          'quiz'
        );
        testCasesPassed = result.passedCount;
        totalTestCases = result.totalTestCases;
        isCorrect = result.allPassed;
      } else {
        // If no test cases, consider it correct if code is provided
        isCorrect = code && code.trim().length > 0;
      }
    }

    // Calculate score based on correctness, time, and level
    let score = 0;
    if (isCorrect) {
      const baseScore = levelNum * 10;
      let timeBonus = 0;

      if (questionType === 'mcq') {
        timeBonus = Math.max(0, 30 - timeTaken) * 2;
      } else if (questionType === 'output_prediction') {
        timeBonus = Math.max(0, 60 - timeTaken);
      }

      score = baseScore + timeBonus;

      // Reduce score if lifeline was used
      if (lifelineUsed) {
        score = Math.floor(score * 0.8); // 20% penalty
      }
    }

    // Create submission record
    const submission = new QuizSubmission({
      userId: req.user.id,
      language,
      level: levelNum,
      questionId,
      questionType,
      answer,
      isCorrect,
      timeTaken,
      code: code || '',
      lifelineUsed,
      score,
      testCasesPassed,
      totalTestCases
    });

    await submission.save();

    // Update user progress
    let progress = await QuizProgress.findOne({
      userId: req.user.id,
      language
    });

    if (!progress) {
      progress = new QuizProgress({
        userId: req.user.id,
        language
      });
    }

    // Update scores and stats
    progress.scores.set(levelNum.toString(), (progress.scores.get(levelNum.toString()) || 0) + score);
    progress.totalScore += score;

    // Update accuracy
    const totalSubmissions = await QuizSubmission.countDocuments({
      userId: req.user.id,
      language
    });
    const correctSubmissions = await QuizSubmission.countDocuments({
      userId: req.user.id,
      language,
      isCorrect: true
    });
    progress.accuracy = totalSubmissions > 0 ? (correctSubmissions / totalSubmissions) * 100 : 0;

    // Update average time
    const avgTimeResult = await QuizSubmission.aggregate([
      { $match: { userId: req.user.id, language } },
      { $group: { _id: null, avgTime: { $avg: '$timeTaken' } } }
    ]);
    progress.averageTime = avgTimeResult[0]?.avgTime || 0;

    // Mark question as solved
    if (isCorrect) {
      if (!progress.solvedQuestions.includes(questionId)) {
        progress.solvedQuestions.push(questionId);
      }

      // FIXED: Complete level immediately after solving one question correctly
      // This ensures Level N → Question N mapping and immediate unlock
      if (levelNum > progress.completedLevels) {
        progress.completedLevels = levelNum;
        progress.currentLevel = Math.min(100, levelNum + 1);

        // Award coins for completing level
        progress.coins += levelNum * 5;

        // Check for badges
        if (levelNum === 10 && !progress.badges.includes('level_10')) {
          progress.badges.push('level_10');
        }
        if (levelNum === 25 && !progress.badges.includes('level_25')) {
          progress.badges.push('level_25');
        }
        if (levelNum === 50 && !progress.badges.includes('level_50')) {
          progress.badges.push('level_50');
        }
        if (levelNum === 100 && !progress.badges.includes('level_100')) {
          progress.badges.push('level_100');
        }

        console.log(`🎉 Level ${levelNum} completed! Next level: ${progress.currentLevel}`);
      }
    }

    progress.lastPlayed = new Date();
    await progress.save();
    console.log('💾 Progress saved:', {
      userId: req.user.id,
      language,
      completedLevels: progress.completedLevels,
      currentLevel: progress.currentLevel,
      totalScore: progress.totalScore
    });

    // FIXED: Emit Socket.io event for real-time progress update
    const io = req.app.get('io');
    if (io) {
      const updateData = {
        language,
        completedLevels: progress.completedLevels,
        currentLevel: progress.currentLevel,
        totalScore: progress.totalScore,
        coins: progress.coins,
        accuracy: Math.round(progress.accuracy),
        levelComplete: isCorrect && levelNum === progress.completedLevels
      };

      console.log(`📡 Emitting progress update to user_${req.user.id}:`, updateData);
      io.to(`user_${req.user.id}`).emit('programmingQuiz:progressUpdate', updateData);

      // Also emit to all sockets (broadcast) for this user
      io.emit('programmingQuiz:progressUpdate', {
        userId: req.user.id,
        ...updateData
      });
    }

    res.json({
      isCorrect,
      score,
      explanation: question.explanation,
      codeExample: question.codeExample,
      testCasesPassed,
      totalTestCases,
      progress: {
        currentLevel: progress.currentLevel,
        completedLevels: progress.completedLevels,
        coins: progress.coins,
        totalScore: progress.totalScore,
        accuracy: Math.round(progress.accuracy)
      }
    });

  } catch (error) {
    console.error('Submit quiz answer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Run code with Judge0
router.post('/run-code', auth, async (req, res) => {
  try {
    const { language, code, questionId, level } = req.body;

    // Get question to retrieve test cases
    const levelQuestions = getQuestionsForLevel(language, parseInt(level));
    const question = levelQuestions?.find(q => q.id === questionId);

    if (!question || !question.testCases) {
      return res.status(404).json({ message: 'Question or test cases not found' });
    }

    // Execute code with test cases
    const result = await judge0Service.executeWithTestCases(
      code,
      language,
      question.testCases,
      'quiz'
    );

    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Run code error:', error);
    res.status(500).json({
      message: 'Code execution failed',
      error: error.message
    });
  }
});

// Save draft
router.post('/save-draft', auth, async (req, res) => {
  try {
    const { language, level, questionId, code, answer, timeSpent } = req.body;

    const draft = await QuizDraft.findOneAndUpdate(
      {
        userId: req.user.id,
        language,
        level,
        questionId
      },
      {
        code: code || '',
        answer: answer || null,
        timeSpent: timeSpent || 0,
        lastSavedAt: new Date()
      },
      {
        upsert: true,
        new: true
      }
    );

    res.json({
      success: true,
      draft
    });

  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({ message: 'Failed to save draft' });
  }
});

// Get draft
router.get('/draft/:language/:level/:questionId', auth, async (req, res) => {
  try {
    const { language, level, questionId } = req.params;

    const draft = await QuizDraft.findOne({
      userId: req.user.id,
      language,
      level: parseInt(level),
      questionId
    });

    res.json(draft || null);

  } catch (error) {
    console.error('Get draft error:', error);
    res.status(500).json({ message: 'Failed to get draft' });
  }
});

// Use lifeline
router.post('/use-lifeline', auth, async (req, res) => {
  try {
    const { language, level, questionId, lifelineType } = req.body;

    const progress = await QuizProgress.findOne({
      userId: req.user.id,
      language
    });

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    // Check coin balance
    const lifelineCost = 10;
    if (progress.coins < lifelineCost) {
      return res.status(400).json({ message: 'Not enough coins' });
    }

    // Get question
    const levelQuestions = getQuestionsForLevel(language, parseInt(level));
    const question = levelQuestions?.find(q => q.id === questionId);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    let lifelineData = {};

    if (lifelineType === 'fifty_fifty') {
      // Remove two wrong options (only for MCQ)
      if (question.options && question.answerIndex !== undefined) {
        const correctIndex = question.answerIndex;
        const wrongIndices = question.options
          .map((_, idx) => idx)
          .filter(idx => idx !== correctIndex);

        // Randomly select 2 wrong options to remove
        const toRemove = wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2);

        lifelineData = {
          type: 'fifty_fifty',
          removedIndices: toRemove
        };
      }
    } else if (lifelineType === 'swap_question') {
      // Get another question from the same level
      const otherQuestions = levelQuestions.filter(q =>
        q.id !== questionId && !progress.solvedQuestions.includes(q.id)
      );

      if (otherQuestions.length > 0) {
        const newQuestion = otherQuestions[Math.floor(Math.random() * otherQuestions.length)];
        lifelineData = {
          type: 'swap_question',
          newQuestion
        };
      } else {
        return res.status(400).json({ message: 'No other questions available' });
      }
    }

    // Deduct coins
    progress.coins -= lifelineCost;
    progress.lifelinesUsed[lifelineType] = (progress.lifelinesUsed[lifelineType] || 0) + 1;
    await progress.save();

    res.json({
      success: true,
      coins: progress.coins,
      lifelineData
    });

  } catch (error) {
    console.error('Use lifeline error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get certificate for completed quiz
router.get('/certificate/:language', auth, async (req, res) => {
  try {
    const { language } = req.params;

    const progress = await QuizProgress.findOne({
      userId: req.user.id,
      language,
      completedLevels: 100
    });

    if (!progress) {
      return res.status(404).json({ message: 'Certificate not available' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    res.json({
      userName: user.username,
      language: language.charAt(0).toUpperCase() + language.slice(1),
      totalScore: progress.totalScore,
      accuracy: Math.round(progress.accuracy),
      averageTime: Math.round(progress.averageTime),
      completedDate: progress.lastPlayed.toISOString().split('T')[0],
      certificateId: `QUIZ-${language}-${req.user.id}-${Date.now()}`
    });

  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download certificate as PDF
router.get('/certificate/:language/download', auth, async (req, res) => {
  try {
    const { language } = req.params;

    const progress = await QuizProgress.findOne({
      userId: req.user.id,
      language,
      completedLevels: 100
    });

    if (!progress) {
      return res.status(404).json({ message: 'Certificate not available' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    const certificateText = `
InturnX Programming Quiz Arena Certificate

This certifies that ${user.username} has successfully completed
all 100 levels of the ${language.toUpperCase()} Programming Challenge.

Total Score: ${progress.totalScore}
Accuracy: ${Math.round(progress.accuracy)}%
Average Time: ${Math.round(progress.averageTime)} seconds

Completed on: ${progress.lastPlayed.toISOString().split('T')[0]}

Certificate ID: QUIZ-${language}-${req.user.id}-${Date.now()}
    `;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="InturnX-${language}-Certificate.txt"`);
    res.send(certificateText);

  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to check Socket.io status
router.get('/debug/socket-status', auth, (req, res) => {
  const io = req.app.get('io');
  if (!io) {
    return res.json({ error: 'Socket.io not initialized' });
  }

  const rooms = Array.from(io.sockets.adapter.rooms.keys());
  const sockets = Array.from(io.sockets.sockets.keys());

  res.json({
    totalSockets: sockets.length,
    totalRooms: rooms.length,
    rooms: rooms,
    sockets: sockets,
    userRoom: `user_${req.user.id}`,
    isUserInRoom: rooms.includes(`user_${req.user.id}`)
  });
});

module.exports = router;