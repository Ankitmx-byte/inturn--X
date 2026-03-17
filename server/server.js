require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const session = require('express-session');
const passport = require('passport');

// Initialize database
const { connectDB } = require('./database');
connectDB();

// Initialize AI Service
const aiService = require('./services/aiService');
aiService.checkOllamaAvailability();

// Import routes
const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const battlesRoutes = require('./routes/battles');
const aiRoutes = require('./routes/ai');
const projectsRoutes = require('./routes/projects');
const internshipsRoutes = require('./routes/internships');
const adminRoutes = require('./routes/admin');
const usersRoutes = require('./routes/users');
const quizRoutes = require('./routes/quiz');
const codeRoutes = require('./routes/code');
const leaderboardRoutes = require('./routes/leaderboard');
const mockInterviewRoutes = require('./routes/mockInterview');
const antiCheatRoutes = require('./routes/antiCheat');
const learningRoutes = require('./routes/learning');

// Import battle manager
const BattleManager = require('./utils/battleManager');

// Initialize Passport
require('./config/passport');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [process.env.CLIENT_URL || "http://localhost:5173", "http://192.168.17.156:5173", "http://localhost:5173", "http://127.0.0.1:5173", "http://10.239.52.112:5173"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL || "http://localhost:5173", "http://192.168.17.156:5173", "http://localhost:5173", "http://127.0.0.1:5173", "http://10.239.52.112:5173"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../client/dist')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/battles', battlesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/internships', internshipsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/mock-interview', mockInterviewRoutes);
app.use('/api/anti-cheat', antiCheatRoutes);
app.use('/api/learning', learningRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'InturnX Server is running' });
});

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Make io accessible to routes
app.set('io', io);

// Initialize Battle Manager
const battleManager = new BattleManager(io);

// Socket.io for real-time coding battles
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Programming Quiz events - join user room for real-time updates
  socket.on('programmingQuiz:join', (data) => {
    const { userId } = data;
    socket.join(`user_${userId}`);
    console.log(`✅ User ${userId} joined programming quiz room (socket: ${socket.id})`);
    
    // Send confirmation
    socket.emit('programmingQuiz:joined', { 
      userId, 
      room: `user_${userId}`,
      socketId: socket.id 
    });
  });

  // Programming Quiz - question completed event
  socket.on('programmingQuiz:questionCompleted', async (data) => {
    const { userId, language, level, isCorrect } = data;
    console.log(`📝 Question completed event: User ${userId}, Level ${level}, Correct: ${isCorrect}`);
    
    // Broadcast to user's room
    io.to(`user_${userId}`).emit('programmingQuiz:progressUpdate', {
      language,
      level,
      isCorrect,
      timestamp: new Date()
    });
  });

  // Join matchmaking queue
  socket.on('join-queue', async (data) => {
    await battleManager.joinQueue(socket, data);
  });

  // Leave queue
  socket.on('leave-queue', (data) => {
    battleManager.leaveQueue(socket, data);
  });

  // Join battle room
  socket.on('join-battle', (battleId) => {
    socket.join(battleId);
    console.log(`Player ${socket.id} joined battle ${battleId}`);
  });

  // Code updates
  socket.on('code-update', (data) => {
    battleManager.updateCode(socket, data);
  });

  // Submit solution
  socket.on('submit-solution', async (data) => {
    await battleManager.submitSolution(socket, data);
  });

  // Mock Interview events
  socket.on('join-interview', (interviewId) => {
    socket.join(`interview_${interviewId}`);
    console.log(`User ${socket.id} joined interview ${interviewId}`);
  });

  socket.on('leave-interview', (interviewId) => {
    socket.leave(`interview_${interviewId}`);
    console.log(`User ${socket.id} left interview ${interviewId}`);
  });

  // Voice assistant events
  socket.on('request-voice', async (data) => {
    try {
      const voiceAssistant = require('./services/voiceAssistant');
      const audioData = await voiceAssistant.speak(data.text, data.personaKey);
      
      socket.emit('ai-voice', {
        audioData,
        text: data.text,
        questionId: data.questionId
      });
    } catch (error) {
      console.error('Voice generation error:', error);
      socket.emit('voice-error', { error: 'Failed to generate voice' });
    }
  });

  // JARVIS AI Assistant events
  socket.on('jarvis-chat', async (data) => {
    try {
      const jarvisService = require('./services/jarvisService');
      const { sessionId, message, context } = data;
      
      const response = await jarvisService.chat(sessionId, message, context);
      
      socket.emit('jarvis-response', {
        response: response.response,
        success: response.success,
        fallback: response.fallback || false
      });
    } catch (error) {
      console.error('JARVIS chat error:', error);
      socket.emit('jarvis-response', {
        response: "I apologize, Sir. I'm experiencing technical difficulties. Please try again.",
        success: false,
        error: true
      });
    }
  });

  socket.on('jarvis-clear', (data) => {
    try {
      const jarvisService = require('./services/jarvisService');
      jarvisService.clearConversation(data.sessionId);
      socket.emit('jarvis-cleared', { success: true });
    } catch (error) {
      console.error('JARVIS clear error:', error);
    }
  });

  socket.on('jarvis-tip', async (data) => {
    try {
      const jarvisService = require('./services/jarvisService');
      const tip = await jarvisService.getQuickTip(data.category);
      socket.emit('jarvis-tip', { tip });
    } catch (error) {
      console.error('JARVIS tip error:', error);
    }
  });

  // Anti-Cheat events
  socket.on('antiCheat:event', async (data) => {
    try {
      const antiCheatService = require('./services/antiCheatService');
      const { userId, sessionId, sessionType, eventType, metadata } = data;

      const log = await antiCheatService.logEvent(
        userId,
        sessionId,
        sessionType,
        eventType,
        metadata
      );

      const fairnessScore = await antiCheatService.getFairnessScore(userId, sessionId);

      // Emit fairness update to the user
      socket.emit('antiCheat:fairnessUpdate', {
        currentScore: fairnessScore.currentScore,
        penalties: fairnessScore.penalties,
        isDisqualified: fairnessScore.isDisqualified
      });

      // Check for disqualification
      if (fairnessScore.isDisqualified) {
        socket.emit('antiCheat:disqualify', {
          reason: fairnessScore.disqualificationReason,
          finalScore: fairnessScore.currentScore
        });
      }

      console.log(`Anti-cheat event logged: ${eventType} for session ${sessionId}`);
    } catch (error) {
      console.error('Anti-cheat event error:', error);
    }
  });

  socket.on('antiCheat:enabled', (data) => {
    console.log(`Anti-cheat enabled for session ${data.sessionId}`);
    socket.emit('antiCheat:status', { enabled: true });
  });

  socket.on('antiCheat:disabled', (data) => {
    console.log(`Anti-cheat disabled for session ${data.sessionId}`);
    socket.emit('antiCheat:status', { enabled: false });
  });

  // Body language analysis events
  socket.on('body-language-update', async (data) => {
    try {
      const MockInterview = require('./models/MockInterview');
      const { interviewId, analysis, timestamp } = data;
      
      // Update interview with body language data
      const interview = await MockInterview.findById(interviewId);
      if (interview) {
        if (!interview.bodyLanguage.enabled) {
          interview.bodyLanguage.enabled = true;
        }
        
        // Add new analysis
        interview.bodyLanguage.analyses.push({
          timestamp: timestamp || new Date(),
          ...analysis
        });
        
        // Update summary (running averages)
        const analyses = interview.bodyLanguage.analyses;
        const count = analyses.length;
        
        interview.bodyLanguage.summary = {
          avgPosture: analyses.reduce((sum, a) => sum + a.posture.score, 0) / count,
          avgEyeContact: analyses.reduce((sum, a) => sum + a.eyeContact.score, 0) / count,
          avgExpression: analyses.reduce((sum, a) => sum + a.facialExpression.score, 0) / count,
          avgHeadPosition: analyses.reduce((sum, a) => sum + a.headPosition.score, 0) / count,
          avgOverallPresence: analyses.reduce((sum, a) => sum + a.overallPresence.score, 0) / count,
          totalAnalyses: count
        };
        
        await interview.save();
        console.log(`Body language analysis saved for interview ${interviewId}`);
      }
    } catch (error) {
      console.error('Body language update error:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    battleManager.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at: http://0.0.0.0:${PORT}`);
  console.log(`For network access, use your local IP address`);
});

module.exports = app;
