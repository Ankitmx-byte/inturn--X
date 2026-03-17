import React, { useState, useEffect, useRef } from 'react';
import BackButton from './BackButton';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';

const MockInterview = () => {
  const { user } = useAuth();
  const [stage, setStage] = useState('setup'); // setup, greeting, interviewing, completed
  const [interviewId, setInterviewId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [finalReport, setFinalReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [speechError, setSpeechError] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize camera
  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setStage('greeting');
    } catch (error) {
      console.error('Failed to acquire camera feed:', error);
      setError("Failed to initialize interview component. Please ensure you have a camera and microphone connected and have granted permission to use them.");
    }
  };

  // Initialize speech synthesis and recognition
  useEffect(() => {
    // Speech Recognition Setup
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interim += transcript;
          }
        }

        if (finalTranscript) {
          setCurrentAnswer(prev => prev + finalTranscript + ' ');
          setInterimTranscript('');
        } else {
          setInterimTranscript(interim);
        }
      };

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setListening(true);
        setSpeechError(null);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        if (listening) {
          setListening(false);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access denied. Please allow access.');
        } else if (event.error === 'network') {
          setSpeechError('Network error accessing speech services. Please check your connection or type your answer.');
        } else {
          setSpeechError(`Voice error: ${event.error}. You can type your answer.`);
        }
      };
    }

    // Voice Loading
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('Voices loaded:', voices.length);
      }
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Assign video stream
  useEffect(() => {
    if (stage === 'interviewing' && streamRef.current) {
      const assignStream = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        } else {
          setTimeout(assignStream, 100);
        }
      };
      assignStream();
    }
  }, [stage]);

  const speakText = (text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice =>
      voice.name.includes('Google US English') ||
      voice.name.includes('Microsoft David') ||
      voice.lang === 'en-US'
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      setTimeout(() => toggleVoiceInput(true), 500);
    };
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const testVoice = () => {
    speakText("Hello! I am your AI interviewer. Can you hear me clearly?");
  };

  const startInterview = async () => {
    if (!userRole) return;
    setIsLoading(true);

    try {
      const response = await axios.post('/api/mock-interview/start', {
        personaKey: 'rahul',
        difficulty: 'medium',
        types: ['Behavioral', 'Technical']
      });

      const { interview } = response.data;
      setInterviewId(interview.id);
      setStage('interviewing');

      const openingMessage = interview.transcript.find(t => t.role === 'ai')?.text;
      if (openingMessage) {
        speakText(openingMessage);
      }

      fetchNextQuestion(interview.id);

    } catch (error) {
      console.error('Failed to start interview:', error);
      setError('Failed to start interview session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNextQuestion = async (id) => {
    try {
      const response = await axios.post(`/api/mock-interview/${id}/next-question`);

      if (response.data.shouldEnd) {
        completeInterview(id);
        return;
      }

      setCurrentQuestion(response.data.question);
      setCurrentQuestionIndex(response.data.questionNumber || currentQuestionIndex + 1);

      if (response.data.question) {
        speakText(response.data.question);
      }

    } catch (error) {
      console.error('Failed to get next question:', error);
    }
  };

  const toggleVoiceInput = (forceStart = false) => {
    if (!recognitionRef.current) return;

    if (listening && !forceStart) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
        setSpeechError(null);
      } catch (error) {
        if (error.name !== 'InvalidStateError') {
          console.error('Speech start error:', error);
        }
      }
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    setIsProcessing(true);
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }

    try {
      const response = await axios.post(`/api/mock-interview/${interviewId}/answer`, {
        answer: currentAnswer
      });

      const { answerFeedback, hasFollowup, followupQuestion } = response.data;

      setAnswers(prev => [...prev, {
        question: currentQuestion,
        answer: currentAnswer,
        feedback: answerFeedback
      }]);

      setEvaluation(answerFeedback);
      setCurrentAnswer('');

      if (hasFollowup) {
        setCurrentQuestion(followupQuestion);
        speakText(followupQuestion);
      } else {
        fetchNextQuestion(interviewId);
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to submit answer. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const completeInterview = async (id) => {
    try {
      const response = await axios.post(`/api/mock-interview/${id}/end`);
      setFinalReport(response.data.evaluation);
      setStage('completed');
    } catch (error) {
      console.error('Failed to end interview:', error);
    }
  };

  const resetInterview = () => {
    setStage('greeting');
    setInterviewId(null);
    setCurrentQuestion(null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCurrentAnswer('');
    setEvaluation(null);
    setFinalReport(null);
    setUserRole('');
    if (synthRef.current) synthRef.current.cancel();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#14A44D] mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
          <p className="text-gray-400">Preparing your interview session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full transition-colors">
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Setup Your Mock Interview</h1>
          <p className="text-xl text-gray-300 mb-8">Please grant permission to use your camera and microphone.</p>
          <button
            onClick={initCamera}
            className="bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] hover:opacity-90 px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-all transform hover:scale-105"
          >
            Grant Permissions
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'greeting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white">
        <BackButton />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">AI Mock Interview</h1>
            <p className="text-xl text-gray-300">
              Practice with our advanced AI interviewer. Real-time feedback, voice interaction, and personalized questions.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-6">Select Your Role</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {['Software Engineer', 'Web Developer', 'Data Analyst', 'Full Stack Developer'].map((role) => (
                <button
                  key={role}
                  onClick={() => setUserRole(role)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${userRole === role
                      ? 'border-[#14A44D] bg-[#14A44D]/20 text-white'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                >
                  <h3 className="text-lg font-semibold">{role}</h3>
                </button>
              ))}
            </div>

            <div className="text-center">
              <div className="mb-4">
                <button
                  onClick={testVoice}
                  className="text-[#14A44D] hover:text-[#14A44D]/80 text-sm font-medium underline"
                >
                  Test Audio Output
                </button>
              </div>
              <button
                onClick={startInterview}
                disabled={!userRole}
                className={`px-8 py-4 rounded-full text-lg font-semibold transition-all transform ${userRole
                    ? 'bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] hover:scale-105 shadow-lg'
                    : 'bg-gray-700 cursor-not-allowed opacity-50'
                  }`}
              >
                Start Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'interviewing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white">
        <BackButton />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Feed */}
            <div className="space-y-4">
              <div className="bg-black/40 rounded-2xl overflow-hidden border border-white/10 relative aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${listening ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                  <span className="text-xs font-medium bg-black/50 px-2 py-1 rounded">
                    {listening ? 'Listening...' : 'Mic Off'}
                  </span>
                </div>
                {speaking && (
                  <div className="absolute top-4 right-4 bg-[#14A44D]/80 text-white text-xs px-3 py-1 rounded-full flex items-center animate-pulse">
                    <span className="mr-2">AI Speaking</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-3 bg-white animate-bounce"></div>
                      <div className="w-1 h-3 bg-white animate-bounce delay-75"></div>
                      <div className="w-1 h-3 bg-white animate-bounce delay-150"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Real-time Transcript */}
              <div className="bg-white/5 rounded-xl p-4 h-48 overflow-y-auto border border-white/10">
                <p className="text-gray-400 text-sm mb-2">Live Transcript:</p>
                <p className="text-lg">
                  {currentAnswer}
                  <span className="text-gray-500">{interimTranscript}</span>
                </p>
              </div>
            </div>

            {/* Interaction Area */}
            <div className="flex flex-col justify-between bg-white/5 rounded-2xl p-6 border border-white/10">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm text-[#14A44D] font-medium tracking-wider uppercase">Question {currentQuestionIndex}</span>
                  <span className="text-sm text-gray-400">{userRole}</span>
                </div>

                <h2 className="text-2xl font-semibold mb-8 leading-relaxed">
                  {currentQuestion || "Connecting to AI interviewer..."}
                </h2>

                {evaluation && (
                  <div className="mb-6 bg-[#14A44D]/10 border border-[#14A44D]/20 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-xl mr-2">{evaluation.icon}</span>
                      <span className="font-semibold text-[#14A44D] capitalize">{evaluation.level.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-gray-300">{evaluation.message}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => toggleVoiceInput()}
                    className={`p-4 rounded-full transition-all transform hover:scale-110 ${listening
                        ? 'bg-red-500 shadow-lg shadow-red-500/30'
                        : 'bg-white/10 hover:bg-white/20'
                      }`}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>

                {speechError && (
                  <div className="text-center text-red-400 text-sm">
                    {speechError}
                  </div>
                )}

                <button
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim() || isProcessing}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${currentAnswer.trim() && !isProcessing
                      ? 'bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] hover:shadow-lg hover:shadow-[#14A44D]/20 transform hover:-translate-y-1'
                      : 'bg-gray-700 cursor-not-allowed opacity-50'
                    }`}
                >
                  {isProcessing ? 'Analyzing...' : 'Submit Answer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white">
        <BackButton />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-[#14A44D]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎉</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Interview Complete!</h1>
            <p className="text-xl text-gray-300">Here is your performance summary.</p>
          </div>

          {finalReport && (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">
                <h2 className="text-2xl font-semibold mb-2">Overall Score</h2>
                <div className="text-6xl font-bold text-[#14A44D] mb-2">{finalReport.overallScore || 85}</div>
                <p className="text-gray-400">Great effort!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4 text-green-400">Strengths</h3>
                  <ul className="space-y-2">
                    {finalReport.strengths?.map((s, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2">•</span>{s}
                      </li>
                    )) || <li>Good communication skills</li>}
                  </ul>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4 text-yellow-400">Improvements</h3>
                  <ul className="space-y-2">
                    {finalReport.weaknesses?.map((w, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2">•</span>{w}
                      </li>
                    )) || <li>Add more technical details</li>}
                  </ul>
                </div>
              </div>

              <div className="text-center pt-8">
                <button
                  onClick={resetInterview}
                  className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-full font-semibold transition-colors"
                >
                  Start New Interview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default MockInterview;
