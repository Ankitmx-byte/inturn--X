const MockInterview = require('../models/MockInterview');
const aiService = require('./aiService');
const codeExecutor = require('./codeExecutor');
const pdfGenerator = require('./pdfGenerator');
const fs = require('fs').promises;
const path = require('path');

class InterviewService {
  constructor() {
    this.activeInterviews = new Map(); // Store active interview sessions
  }

  async loadPersona(personaKey) {
    try {
      const personaPath = path.join(__dirname, '../personas', `${personaKey}.json`);
      const personaData = await fs.readFile(personaPath, 'utf-8');
      return JSON.parse(personaData);
    } catch (error) {
      console.error(`Failed to load persona ${personaKey}:`, error);
      throw new Error('Persona not found');
    }
  }

  async getAllPersonas() {
    try {
      const personasDir = path.join(__dirname, '../personas');
      const files = await fs.readdir(personasDir);
      
      const personas = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .map(async file => {
            const data = await fs.readFile(path.join(personasDir, file), 'utf-8');
            const persona = JSON.parse(data);
            return {
              key: persona.key,
              name: persona.name,
              title: persona.title,
              avatar: persona.avatar,
              specialization: persona.specialization,
              tone: persona.tone
            };
          })
      );
      
      return personas;
    } catch (error) {
      console.error('Failed to load personas:', error);
      return [];
    }
  }

  async startInterview(userId, config) {
    try {
      const persona = await this.loadPersona(config.personaKey);
      
      // Create interview record
      const interview = new MockInterview({
        userId,
        persona: {
          key: persona.key,
          name: persona.name
        },
        difficulty: config.difficulty,
        type: config.types,
        transcript: []
      });
      
      await interview.save();
      
      // Add opening message
      const opening = persona.interview_style.opening;
      interview.transcript.push({
        role: 'ai',
        text: opening,
        ts: new Date()
      });
      
      await interview.save();
      
      // Store in active sessions
      this.activeInterviews.set(interview._id.toString(), {
        persona,
        config,
        questionCount: 0,
        currentRound: 1, // Round 1: Interview Questions, Round 2: Coding
        interviewQuestionsCompleted: false
      });
      
      return interview;
    } catch (error) {
      console.error('Failed to start interview:', error);
      throw error;
    }
  }

  async getNextQuestion(interviewId) {
    try {
      const interview = await MockInterview.findById(interviewId);
      if (!interview) throw new Error('Interview not found');
      
      // Get or restore session
      let session = this.activeInterviews.get(interviewId.toString());
      if (!session) {
        // Restore session from interview data
        console.log('Restoring interview session from database');
        const persona = await this.loadPersona(interview.persona.key);
        
        // Count how many interview questions have been asked (excluding opening and coding messages)
        const aiMessages = interview.transcript.filter(t => t.role === 'ai');
        const questionCount = Math.max(0, aiMessages.length - 1); // Subtract opening message
        
        // Determine current round based on transcript
        let currentRound = 1;
        const hasCodingMessage = interview.transcript.some(t => 
          t.role === 'ai' && (
            t.text.includes('coding challenge') || 
            t.text.includes('Coding Round') ||
            t.text.includes('Round 2')
          )
        );
        
        if (hasCodingMessage || interview.coding) {
          currentRound = 2;
        }
        
        session = {
          persona,
          config: {
            types: interview.type,
            difficulty: interview.difficulty
          },
          questionCount: currentRound === 1 ? questionCount : 0,
          currentRound,
          interviewQuestionsCompleted: currentRound === 2
        };
        
        this.activeInterviews.set(interviewId.toString(), session);
      }
      
      const { persona, config } = session;
      
      // Round 1: Interview Questions (always 5 questions)
      const INTERVIEW_QUESTIONS_COUNT = 5;
      
      // Check if we're in Round 1 (Interview Questions)
      if (session.currentRound === 1) {
        // Check if Round 1 is complete BEFORE incrementing
        if (session.questionCount >= INTERVIEW_QUESTIONS_COUNT) {
          session.interviewQuestionsCompleted = true;
          
          // Check if coding round should start
          if (config.types.includes('Coding') || config.types.includes('DSA')) {
            session.currentRound = 2;
            session.questionCount = 0; // Reset for coding round
            
            // Add transition message to transcript
            interview.transcript.push({
              role: 'ai',
              text: "Excellent work on Round 1! You've completed all interview questions. Now let's move to Round 2: the coding challenge.",
              ts: new Date()
            });
            await interview.save();
            
            return {
              shouldEnd: false,
              roundTransition: true,
              message: "Excellent work on Round 1! You've completed all interview questions. Now let's move to Round 2: the coding challenge.",
              nextRound: 'coding',
              currentRound: 2,
              roundName: 'Coding Round'
            };
          } else {
            // No coding round, end interview
            return {
              shouldEnd: true,
              message: persona.interview_style?.closing || "Thank you for participating in this interview. We'll review your responses and get back to you soon."
            };
          }
        }
        
        // Increment question count for new question
        session.questionCount += 1;
        
        // Continue with Round 1 questions
        const totalQuestions = INTERVIEW_QUESTIONS_COUNT;
      
        // Get previous questions
        const previousQuestions = interview.transcript
          .filter(t => t.role === 'ai')
          .map(t => t.text);
        
        // Generate next question
        const question = await aiService.generateQuestion(persona, {
          types: config.types,
          difficulty: interview.difficulty,
          questionNumber: session.questionCount,
          totalQuestions,
          previousQuestions
        });
        
        // Add to transcript
        interview.transcript.push({
          role: 'ai',
          text: question,
          ts: new Date()
        });
        
        await interview.save();
        
        return {
          shouldEnd: false,
          question,
          questionNumber: session.questionCount,
          totalQuestions,
          currentRound: 1,
          roundName: 'Interview Questions'
        };
      }
      
      // Round 2: Coding Round
      if (session.currentRound === 2) {
        // Check if coding question already asked
        if (session.questionCount > 0) {
          // Coding round complete, end interview
          return {
            shouldEnd: true,
            message: "Great job completing the coding challenge! The interview is now complete.",
            currentRound: 2,
            roundName: 'Coding Round'
          };
        }
        
        session.questionCount += 1;
        
        // Add coding challenge message to transcript
        const codingMessage = "Here's your coding challenge. Take your time and write clean, efficient code. Click 'Submit Code' when you're ready.";
        interview.transcript.push({
          role: 'ai',
          text: codingMessage,
          ts: new Date()
        });
        await interview.save();
        
        // Coding round - return coding problem
        return {
          shouldEnd: false,
          isCodingRound: true,
          message: codingMessage,
          currentRound: 2,
          roundName: 'Coding Round'
        };
      }
      
      // Should not reach here
      throw new Error('Invalid interview state');
    } catch (error) {
      console.error('Failed to get next question:', error);
      throw error;
    }
  }

  async submitAnswer(interviewId, answer) {
    try {
      const interview = await MockInterview.findById(interviewId);
      if (!interview) throw new Error('Interview not found');
      
      // Analyze answer quality in real-time
      const answerQuality = this.analyzeAnswerQuality(answer);
      
      // Add answer to transcript with quality score
      interview.transcript.push({
        role: 'user',
        text: answer,
        ts: new Date(),
        quality: answerQuality
      });
      
      await interview.save();
      
      const session = this.activeInterviews.get(interviewId.toString());
      if (!session) throw new Error('Interview session not found');
      
      const { persona } = session;
      
      // Check if follow-up is needed
      const lastQuestion = interview.transcript
        .filter(t => t.role === 'ai')
        .pop()?.text || '';
      
      const followup = await aiService.generateFollowup(persona, lastQuestion, answer);
      
      if (followup.needsFollowup) {
        interview.transcript.push({
          role: 'ai',
          text: followup.question,
          ts: new Date()
        });
        
        await interview.save();
        
        return {
          hasFollowup: true,
          followupQuestion: followup.question,
          answerFeedback: this.getAnswerFeedback(answerQuality)
        };
      }
      
      return {
        hasFollowup: false,
        acknowledgment: followup.acknowledgment,
        answerFeedback: this.getAnswerFeedback(answerQuality)
      };
    } catch (error) {
      console.error('Failed to submit answer:', error);
      throw error;
    }
  }

  analyzeAnswerQuality(answer) {
    const length = answer.length;
    const words = answer.split(/\s+/).length;
    
    // Check for quality indicators
    const hasExample = /example|instance|case|situation|time when/i.test(answer);
    const hasStructure = /first|second|third|finally|additionally|moreover/i.test(answer);
    const hasTechnical = /algorithm|complexity|optimize|efficient|scalable|architecture/i.test(answer);
    const hasDetail = length > 150;
    
    let score = 50; // Base score
    
    // Length scoring
    if (length < 30) score -= 20;
    else if (length < 80) score -= 10;
    else if (length > 200) score += 15;
    else if (length > 150) score += 10;
    
    // Quality indicators
    if (hasExample) score += 15;
    if (hasStructure) score += 10;
    if (hasTechnical) score += 10;
    if (hasDetail) score += 5;
    
    // Word count
    if (words > 50) score += 10;
    if (words < 10) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }

  getAnswerFeedback(quality) {
    if (quality >= 80) {
      return {
        level: 'excellent',
        message: 'Great answer! Very detailed and well-structured.',
        icon: '🌟'
      };
    } else if (quality >= 65) {
      return {
        level: 'good',
        message: 'Good answer! Consider adding more specific examples.',
        icon: '👍'
      };
    } else if (quality >= 50) {
      return {
        level: 'average',
        message: 'Decent answer. Try to provide more detail and structure.',
        icon: '💡'
      };
    } else {
      return {
        level: 'needs_improvement',
        message: 'Try to elaborate more with specific examples and details.',
        icon: '📝'
      };
    }
  }

  async submitCode(interviewId, codeData) {
    try {
      const interview = await MockInterview.findById(interviewId);
      if (!interview) throw new Error('Interview not found');
      
      const { code, language, testcases } = codeData;
      
      // Execute code
      const results = await codeExecutor.executeCode(code, language, testcases);
      
      // Store coding results
      interview.coding = {
        language,
        code,
        testcases,
        results: results.results,
        runtime: results.runtime,
        passCount: results.passCount,
        failCount: results.failCount
      };
      
      await interview.save();
      
      return results;
    } catch (error) {
      console.error('Failed to submit code:', error);
      throw error;
    }
  }

  async endInterview(interviewId, userId) {
    try {
      const interview = await MockInterview.findById(interviewId);
      if (!interview) throw new Error('Interview not found');
      
      // Check if already evaluated
      if (interview.evaluation && interview.evaluation.overallScore > 0) {
        console.log('Interview already evaluated, returning existing evaluation');
        return {
          evaluation: interview.evaluation,
          pdfUrl: interview.pdfUrl
        };
      }
      
      // Get or restore session
      let session = this.activeInterviews.get(interviewId.toString());
      if (!session) {
        console.log('Restoring session for interview end');
        const persona = await this.loadPersona(interview.persona.key);
        session = {
          persona,
          config: {
            types: interview.type,
            difficulty: interview.difficulty
          }
        };
      }
      
      const { persona } = session;
      
      // Calculate duration
      const duration = Math.round(
        (new Date() - new Date(interview.createdAt)) / 1000 / 60
      );
      
      // Generate evaluation using AI or intelligent analysis
      let evaluation = await aiService.evaluateInterview(
        persona,
        interview.transcript,
        interview.coding,
        duration
      );
      
      // If AI evaluation failed or returned null, use intelligent evaluation
      if (!evaluation || !evaluation.overallScore) {
        console.log('Using intelligent evaluation based on interview analysis');
        evaluation = await aiService.generateIntelligentEvaluation(
          persona,
          interview.transcript,
          interview.coding,
          duration
        );
      }
      
      interview.evaluation = evaluation;
      
      // Generate PDF report
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      const pdfUrl = await pdfGenerator.generateInterviewReport(
        interview,
        user,
        persona
      );
      
      interview.pdfUrl = pdfUrl;
      await interview.save();
      
      // Clean up active session
      this.activeInterviews.delete(interviewId.toString());
      
      return {
        evaluation,
        pdfUrl
      };
    } catch (error) {
      console.error('Failed to end interview:', error);
      throw error;
    }
  }

  async getUserInterviews(userId, limit = 10) {
    try {
      const interviews = await MockInterview.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('persona difficulty type evaluation.overallScore createdAt pdfUrl');
      
      return interviews;
    } catch (error) {
      console.error('Failed to get user interviews:', error);
      throw error;
    }
  }

  getCodingProblem(difficulty, type) {
    return codeExecutor.generateCodingProblem(difficulty, type);
  }
}

module.exports = new InterviewService();