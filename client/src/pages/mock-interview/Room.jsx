import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';
import WebcamAnalyzer from '../../components/WebcamAnalyzer';

const Room = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCoding, setShowCoding] = useState(false);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [codingProblem, setCodingProblem] = useState(null);
  const [codeResults, setCodeResults] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundName, setRoundName] = useState('Interview Questions');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [socket, setSocket] = useState(null);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [bodyLanguageAnalysis, setBodyLanguageAnalysis] = useState(null);
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  
  const transcriptEndRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    // Check voice support
    const speechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const speechSynthesisSupported = 'speechSynthesis' in window;
    setVoiceSupported(speechRecognitionSupported && speechSynthesisSupported);
    
    // Initialize speech recognition
    if (speechRecognitionSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true; // Keep listening
      recognition.interimResults = true; // Show interim results
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        console.log('Voice recognition started');
        setIsListening(true);
        setError(null);
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
          setAnswer(prev => {
            const newAnswer = prev + (prev && !prev.endsWith(' ') ? ' ' : '') + finalTranscript;
            return newAnswer;
          });
        }
        
        console.log('Interim:', interimTranscript);
      };
      
      recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.');
        } else if (event.error === 'audio-capture') {
          setError('Microphone not found. Please check your microphone.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access.');
        } else {
          setError(`Voice recognition error: ${event.error}`);
        }
        
        setIsListening(false);
      };
      
      recognition.onend = () => {
        console.log('Voice recognition ended');
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    // Initialize speech synthesis
    if (speechSynthesisSupported) {
      synthRef.current = window.speechSynthesis;
    }
    
    loadInterview();
    startTimer();
    
    const newSocket = io(import.meta.env.VITE_API_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to interview room');
      newSocket.emit('join-interview', id);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from interview room');
    });
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (newSocket) {
        newSocket.emit('leave-interview', id);
        newSocket.disconnect();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [transcript]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  };

  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadInterview = async () => {
    try {
      const response = await axios.get(`/api/mock-interview/${id}`);
      const interviewData = response.data.interview;
      
      console.log('Loaded interview:', interviewData);
      
      setInterview(interviewData);
      setTranscript(interviewData.transcript || []);
      
      // Only redirect if interview is truly completed with PDF
      if (interviewData.status === 'completed' && interviewData.evaluation && interviewData.pdfUrl) {
        console.log('Interview fully completed with PDF, redirecting to results');
        navigate(`/mock-interview/result/${id}`);
        return;
      }
      
      // Determine current state from transcript
      const aiMessages = interviewData.transcript.filter(t => t.role === 'ai');
      const hasCodingMessage = aiMessages.some(msg => 
        msg.text.includes('coding challenge') || 
        msg.text.includes('Coding Round') ||
        msg.text.includes('Round 2')
      );
      
      if (hasCodingMessage) {
        console.log('Resuming in coding round');
        setCurrentRound(2);
        setRoundName('Coding Round');
        setShowCoding(true);
        await loadCodingProblem();
      }
      
      // Get first question if transcript only has opening message
      if (interviewData.transcript.length === 1) {
        console.log('Starting interview - getting first question');
        await getNextQuestion();
      } else if (interviewData.transcript.length > 1) {
        const lastAiMessage = aiMessages[aiMessages.length - 1];
        if (lastAiMessage) {
          setCurrentQuestion(lastAiMessage.text);
          console.log('Restored current question:', lastAiMessage.text);
          
          const questionNum = Math.max(1, aiMessages.length - 1);
          setQuestionNumber(questionNum);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load interview:', err);
      setError('Failed to load interview. Please try again.');
      setLoading(false);
    }
  };

  const getNextQuestion = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const response = await axios.post(`/api/mock-interview/${id}/next-question`);
      
      console.log('Next question response:', response.data);
      
      if (response.data.shouldEnd) {
        console.log('Interview complete, asking user to confirm');
        
        const confirmEnd = window.confirm(
          'You have completed all rounds of the interview! Click OK to end the interview and see your results.'
        );
        
        if (confirmEnd) {
          await endInterview(true);
        } else {
          setSubmitting(false);
        }
        return;
      }
      
      if (response.data.roundTransition) {
        console.log('Transitioning to Round 2: Coding');
        
        setCurrentRound(2);
        setRoundName('Coding Round');
        setQuestionNumber(0);
        
        await loadCodingProblem();
        setShowCoding(true);
        
        setTimeout(async () => {
          try {
            const codingResponse = await axios.post(`/api/mock-interview/${id}/next-question`);
            if (codingResponse.data.isCodingRound) {
              setCurrentQuestion(codingResponse.data.message);
            }
          } catch (err) {
            console.error('Failed to get coding question:', err);
          }
        }, 500);
        
        return;
      } 
      
      if (response.data.isCodingRound) {
        console.log('In coding round');
        setShowCoding(true);
        setCurrentRound(2);
        setRoundName('Coding Round');
        setCurrentQuestion(response.data.message);
        
        if (!codingProblem) {
          await loadCodingProblem();
        }
        
        return;
      }
      
      console.log('Regular question - Round 1');
      setCurrentQuestion(response.data.question);
      setQuestionNumber(response.data.questionNumber || 0);
      setTotalQuestions(response.data.totalQuestions || 5);
      setCurrentRound(response.data.currentRound || 1);
      setRoundName(response.data.roundName || 'Interview Questions');
      setShowCoding(false);
      
    } catch (err) {
      console.error('Failed to get next question:', err);
      setError(err.response?.data?.error || 'Failed to get next question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadCodingProblem = async () => {
    try {
      const response = await axios.get('/api/mock-interview/coding/problem', {
        params: {
          difficulty: interview?.difficulty || 'medium',
          type: 'dsa'
        }
      });
      setCodingProblem(response.data.problem);
      setCode(response.data.problem.starterCode[language] || '');
    } catch (err) {
      console.error('Failed to load coding problem:', err);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      setError('Please provide an answer');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      console.log('Submitting answer for question', questionNumber);
      
      setTranscript(prev => [...prev, {
        role: 'user',
        text: answer,
        ts: new Date()
      }]);
      
      const response = await axios.post(`/api/mock-interview/${id}/answer`, {
        answer: answer.trim()
      });
      
      console.log('Answer submitted, response:', response.data);
      
      if (response.data.answerFeedback) {
        setAnswerFeedback(response.data.answerFeedback);
        setTimeout(() => setAnswerFeedback(null), 5000);
      }
      
      if (response.data.hasFollowup) {
        console.log('Has followup question');
        setCurrentQuestion(response.data.followupQuestion);
        setTranscript(prev => [...prev, {
          role: 'ai',
          text: response.data.followupQuestion,
          ts: new Date()
        }]);
      } else {
        console.log('No followup, getting next question');
        await getNextQuestion();
      }
      
      setAnswer('');
    } catch (err) {
      console.error('Failed to submit answer:', err);
      setError(err.response?.data?.error || 'Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitCode = async () => {
    if (!code.trim()) {
      setError('Please write some code');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const response = await axios.post(`/api/mock-interview/${id}/code`, {
        code,
        language,
        testcases: codingProblem?.testcases || []
      });
      
      setCodeResults(response.data);
      
      setTranscript(prev => [...prev, {
        role: 'user',
        text: `Submitted code solution in ${language}`,
        ts: new Date()
      }, {
        role: 'ai',
        text: `Code executed successfully! ${response.data.passCount || 0} out of ${response.data.totalTests || 0} test cases passed.`,
        ts: new Date()
      }]);
      
      setTimeout(() => {
        const confirmEnd = window.confirm('Coding round complete! The interview is now finished. Click OK to see your results.');
        if (confirmEnd) {
          endInterview();
        }
      }, 1500);
      
    } catch (err) {
      console.error('Failed to submit code:', err);
      setError(err.response?.data?.error || 'Failed to execute code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const skipQuestion = async () => {
    setAnswer('I would like to skip this question.');
    await submitAnswer();
  };

  const endInterview = async (skipConfirm = false) => {
    if (!skipConfirm && !window.confirm('Are you sure you want to end the interview?')) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      console.log('Ending interview and generating results...');
      
      const response = await axios.post(`/api/mock-interview/${id}/end`);
      console.log('Interview ended, navigating to results');
      
      navigate(`/mock-interview/result/${id}`);
    } catch (err) {
      console.error('Failed to end interview:', err);
      setError(err.response?.data?.error || 'Failed to end interview. Please try again.');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBodyLanguageUpdate = (analysis) => {
    setBodyLanguageAnalysis(analysis);
    
    if (socket && analysis) {
      socket.emit('body-language-update', {
        interviewId: id,
        analysis: analysis,
        timestamp: new Date()
      });
    }
  };

  const speakText = (text) => {
    if (!text) return;
    
    if (synthRef.current) {
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to get a better voice
      const voices = synthRef.current.getVoices();
      const englishVoice = voices.find(voice => voice.lang.startsWith('en-')) || voices[0];
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      utterance.onstart = () => {
        console.log('AI started speaking');
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        console.log('AI finished speaking');
        setIsSpeaking(false);
      };
      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setIsSpeaking(false);
      };
      
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition not available');
      return;
    }
    
    if (isListening) {
      console.log('Already listening');
      return;
    }
    
    try {
      console.log('Starting voice recognition...');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      if (error.message.includes('already started')) {
        // Recognition is already running, just update state
        setIsListening(true);
      } else {
        setError('Failed to start voice recognition. Please try again.');
      }
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) {
      return;
    }
    
    if (!isListening) {
      console.log('Not listening');
      return;
    }
    
    try {
      console.log('Stopping voice recognition...');
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Error stopping recognition:', error);
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (currentQuestion && aiAssistantEnabled && currentRound === 1) {
      // Small delay to ensure the question is rendered
      const timer = setTimeout(() => {
        speakText(currentQuestion);
      }, 500);
      
      return () => {
        clearTimeout(timer);
        stopSpeaking();
      };
    }
  }, [currentQuestion, aiAssistantEnabled, currentRound]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#14A44D] mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading interview...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-xl font-bold">
                  {interview?.persona?.name}
                </h1>
                <p className="text-sm text-gray-400">
                  {interview?.difficulty.charAt(0).toUpperCase() + interview?.difficulty.slice(1)} Level
                </p>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">{roundName}:</span>
                <span className="ml-2 font-semibold text-[#14A44D]">
                  {currentRound === 1 ? `${questionNumber}/${totalQuestions}` : 'Coding Challenge'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-lg font-mono">
                ⏱️ {formatTime(timeElapsed)}
              </div>
              <button
                onClick={endInterview}
                disabled={submitting}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                End Interview
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/50 rounded-xl p-4"
          >
            <p className="text-red-200">{error}</p>
          </motion.div>
        </div>
      )}

      {answerFeedback && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`border rounded-xl p-4 ${
              answerFeedback.level === 'excellent' ? 'bg-green-500/20 border-green-500/50' :
              answerFeedback.level === 'good' ? 'bg-blue-500/20 border-blue-500/50' :
              answerFeedback.level === 'average' ? 'bg-yellow-500/20 border-yellow-500/50' :
              'bg-orange-500/20 border-orange-500/50'
            }`}
          >
            <p className="text-white flex items-center">
              <span className="text-2xl mr-3">{answerFeedback.icon}</span>
              {answerFeedback.message}
            </p>
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Top Section - Question */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="text-4xl">{interview?.persona?.name?.charAt(0) || '👤'}</div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {currentRound === 1 ? 'Interview Question' : 'Coding Challenge'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {currentRound === 1 ? `Question ${questionNumber} of ${totalQuestions}` : 'Round 2'}
                  </p>
                </div>
              </div>
              
              {/* Round Badge */}
              <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                currentRound === 1 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' 
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
              }`}>
                {roundName}
              </div>
            </div>
            
            <div className="pl-14">
              {currentRound === 1 ? (
                <p className="text-gray-300 leading-relaxed">{currentQuestion}</p>
              ) : (
                codingProblem && (
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">{codingProblem.title}</h4>
                    <p className="text-gray-300 mb-3">{codingProblem.description}</p>
                    
                    {codingProblem.examples && codingProblem.examples.length > 0 && (
                      <div className="space-y-2">
                        {codingProblem.examples.map((example, idx) => (
                          <div key={idx} className="bg-black/30 p-3 rounded-lg text-sm">
                            <div className="font-semibold mb-1">Example {idx + 1}:</div>
                            <div className="text-gray-400">
                              <div><strong>Input:</strong> {example.input}</div>
                              <div><strong>Output:</strong> {example.output}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Main Content - Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - AI Assistant & Webcam */}
            <div className="lg:col-span-1 space-y-6">
              {/* AI Assistant */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">🤖 AI Assistant</h3>
                  <button
                    onClick={() => {
                      setAiAssistantEnabled(!aiAssistantEnabled);
                      if (aiAssistantEnabled) {
                        stopSpeaking();
                      } else if (currentQuestion) {
                        speakText(currentQuestion);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${
                      aiAssistantEnabled 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/50' 
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                    }`}
                  >
                    {aiAssistantEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center h-32 bg-gradient-to-br from-[#14A44D]/20 to-[#5F2EEA]/20 rounded-lg border border-white/10">
                    <div className={`text-6xl transition-all ${isSpeaking ? 'animate-pulse scale-110' : ''}`}>
                      {isSpeaking ? '🔊' : '🎙️'}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-400 text-center">
                    {!voiceSupported ? (
                      'Voice not supported in this browser'
                    ) : aiAssistantEnabled ? (
                      isSpeaking ? 'AI is speaking...' : 'Ready to read questions'
                    ) : (
                      'AI Assistant is OFF'
                    )}
                  </div>
                  
                  {aiAssistantEnabled && voiceSupported && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => speakText(currentQuestion)}
                        disabled={isSpeaking || !currentQuestion}
                        className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-sm transition-all disabled:opacity-50"
                      >
                        🔊 Speak
                      </button>
                      <button
                        onClick={stopSpeaking}
                        disabled={!isSpeaking}
                        className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm transition-all disabled:opacity-50"
                      >
                        ⏹️ Stop
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Webcam Analyzer */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                <WebcamAnalyzer
                  enabled={webcamEnabled}
                  onToggle={() => setWebcamEnabled(!webcamEnabled)}
                  onAnalysisUpdate={handleBodyLanguageUpdate}
                />
              </div>
            </div>

            {/* Right Column - Answer Section */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              {currentRound === 1 ? (
                <h3 className="font-semibold text-lg">✍️ Your Answer</h3>
              ) : (
                <div className="flex items-center space-x-4">
                  <h3 className="font-semibold text-lg">💻 Code Editor</h3>
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      setCode(codingProblem?.starterCode?.[e.target.value] || '');
                    }}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                  </select>
                </div>
              )}
            </div>

            {/* Content Area */}
            {currentRound === 1 ? (
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here or use voice input..."
                    className="w-full h-64 bg-white/5 border border-white/20 rounded-lg p-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-[#14A44D] resize-none"
                    disabled={submitting}
                  />
                  
                  {/* Voice Input Button */}
                  {voiceSupported && (
                    <button
                      onClick={() => {
                        if (isListening) {
                          stopListening();
                        } else {
                          startListening();
                        }
                      }}
                      disabled={submitting}
                      className={`absolute right-3 top-3 p-2 rounded-lg transition-all ${
                        isListening 
                          ? 'bg-red-500/30 text-red-300 animate-pulse' 
                          : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
                      } border ${
                        isListening ? 'border-red-500/50' : 'border-blue-500/50'
                      } disabled:opacity-50`}
                      title={isListening ? 'Stop listening' : 'Start voice input'}
                    >
                      {isListening ? '🔴' : '🎤'}
                    </button>
                  )}
                </div>
                
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-sm text-blue-300 font-medium">
                        Listening... Speak clearly into your microphone
                      </span>
                    </div>
                  </motion.div>
                )}
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    {voiceSupported ? '💡 Click the microphone to use voice input' : '⚠️ Voice input not available'}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={skipQuestion}
                      disabled={submitting}
                      className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-300 disabled:opacity-50"
                    >
                      Skip
                    </button>
                    <button
                      onClick={submitAnswer}
                      disabled={submitting || !answer.trim()}
                      className="px-6 py-2 bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Answer'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-96 border border-white/20 rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true
                    }}
                  />
                </div>
                
                {/* Code Results */}
                {codeResults && (
                  <div className="p-3 bg-black/30 rounded-lg">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-400">Test Cases:</span>
                      <span className={codeResults.passCount > 0 ? 'text-green-400' : 'text-red-400'}>
                        ✓ {codeResults.passCount} passed
                      </span>
                      {codeResults.failCount > 0 && (
                        <span className="text-red-400">
                          ✗ {codeResults.failCount} failed
                        </span>
                      )}
                      <span className="text-gray-400">
                        Runtime: {codeResults.runtime}ms
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={submitCode}
                    disabled={submitting || !code.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {submitting ? 'Running...' : '▶ Run & Submit Code'}
                  </button>
                </div>
              </div>
            )}
              </div>
            </div>
          </div>

          {/* Transcript - Full Width Below */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <h3 className="font-semibold text-lg mb-4">📝 Interview Transcript</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              <AnimatePresence>
                {transcript.map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: entry.role === 'ai' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg ${
                      entry.role === 'ai'
                        ? 'bg-[#14A44D]/20 border-l-4 border-[#14A44D]'
                        : 'bg-[#5F2EEA]/20 border-l-4 border-[#5F2EEA]'
                    }`}
                  >
                    <div className="text-xs text-gray-400 mb-1">
                      {entry.role === 'ai' ? interview?.persona?.name : 'You'}
                    </div>
                    <div className="text-sm">{entry.text}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;