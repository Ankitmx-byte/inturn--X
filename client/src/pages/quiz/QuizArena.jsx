import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from '../../utils/axios';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import AntiCheatOverlay from '../../components/AntiCheatOverlay';
import BackButton from '../../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

// Lazy load Monaco Editor for better performance
const Editor = lazy(() => import('@monaco-editor/react'));

const QuizArena = () => {
  const { language, level } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [answer, setAnswer] = useState('');
  const [code, setCode] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [selectedLifeline, setSelectedLifeline] = useState(null);
  const [removedOptions, setRemovedOptions] = useState([]);
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const autosaveRef = useRef(null);
  const levelNum = parseInt(level);

  const { user } = useAuth();

  // Anti-cheat integration
  const {
    isEnabled: antiCheatEnabled,
    fairnessScore,
    penalties,
    isDisqualified,
    enableAntiCheat,
    disableAntiCheat
  } = useAntiCheat(`quiz-${language}-${level}`, 'quiz', user?._id);

  // Determine question type and timer based on level
  const getQuestionConfig = () => {
    if (levelNum >= 1 && levelNum <= 30) {
      return { type: 'mcq', timeLimit: 30, hasTimer: true };
    } else if (levelNum >= 31 && levelNum <= 60) {
      return { type: 'output_prediction', timeLimit: 60, hasTimer: true };
    } else if (levelNum >= 61 && levelNum <= 85) {
      return { type: 'short_code', timeLimit: 300, hasTimer: true }; // 5 minutes
    } else {
      return { type: 'full_problem', timeLimit: null, hasTimer: false }; // Unlimited
    }
  };

  const config = getQuestionConfig();

  // Socket.io connection for real-time updates
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to quiz arena socket');
      socket.emit('programmingQuiz:join', { userId: user._id });
    });

    socket.on('programmingQuiz:progressUpdate', (data) => {
      console.log('📊 Progress update received in arena:', data);
      if (data.language === language) {
        setProgress(prev => ({
          ...prev,
          completedLevels: data.completedLevels,
          currentLevel: data.currentLevel,
          totalScore: data.totalScore,
          coins: data.coins,
          accuracy: data.accuracy || 0
        }));

        // If level is complete, show success and redirect
        if (data.levelComplete) {
          console.log('🎉 Level completed! Moving to next level...');
          setTimeout(() => {
            navigate(`/quiz/${language}/${data.currentLevel}`);
          }, 2000);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from quiz arena socket');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      console.log('🔌 Cleaning up socket connection');
      socket.disconnect();
    };
  }, [language, navigate, user]);

  useEffect(() => {
    fetchQuestion();
  }, [language, level]);

  useEffect(() => {
    if (config.hasTimer && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (config.hasTimer && timeLeft === 0 && question) {
      handleAutoSubmit();
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, config.hasTimer]);

  // Elapsed timer for unlimited time questions
  useEffect(() => {
    if (!config.hasTimer && question) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [config.hasTimer, question]);

  // Auto-save drafts every 20 seconds for coding questions
  useEffect(() => {
    if ((config.type === 'short_code' || config.type === 'full_problem') && question) {
      autosaveRef.current = setInterval(() => {
        saveDraft();
      }, 20000); // 20 seconds

      return () => clearInterval(autosaveRef.current);
    }
  }, [config.type, question, code, answer]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/quiz/${language}/${level}`);

      if (response.data.levelComplete) {
        navigate(`/quiz/${language}/${parseInt(level) + 1}`);
        return;
      }

      setQuestion(response.data.question);
      setProgress(response.data.progress);

      if (config.hasTimer) {
        setTimeLeft(config.timeLimit);
      }

      // Load draft if exists
      if (config.type === 'short_code' || config.type === 'full_problem') {
        loadDraft(response.data.question.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching question:', error);
      setLoading(false);
    }
  };

  const loadDraft = async (questionId) => {
    try {
      const response = await axios.get(`/api/quiz/draft/${language}/${level}/${questionId}`);
      if (response.data) {
        setCode(response.data.code || '');
        setAnswer(response.data.answer || '');
        setElapsedTime(response.data.timeSpent || 0);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const saveDraft = async () => {
    if (!question) return;

    try {
      await axios.post('/api/quiz/save-draft', {
        language,
        level: levelNum,
        questionId: question.id,
        code,
        answer,
        timeSpent: config.hasTimer ? (config.timeLimit - timeLeft) : elapsedTime
      });
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleRunCode = async () => {
    if (!code) return;

    setExecuting(true);
    try {
      const response = await axios.post('/api/quiz/run-code', {
        language,
        code,
        questionId: question.id,
        level: levelNum
      });

      setTestResults(response.data.result);
    } catch (error) {
      console.error('Error running code:', error);
      alert('Code execution failed. Please try again.');
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const timeTaken = config.hasTimer ? (config.timeLimit - timeLeft) : elapsedTime;

      const response = await axios.post('/api/quiz/submit', {
        language,
        level: levelNum,
        questionId: question.id,
        answer: config.type === 'mcq' ? answer : code,
        timeTaken,
        lifelineUsed: selectedLifeline,
        code: config.type !== 'mcq' ? code : undefined
      });

      setResult(response.data);
      setShowResult(true);

      // Emit question completed event for real-time updates
      if (socketRef.current && user?._id) {
        socketRef.current.emit('programmingQuiz:questionCompleted', {
          userId: user._id,
          language,
          level: levelNum,
          isCorrect: response.data.isCorrect
        });
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    }
  };

  const handleAutoSubmit = () => {
    if (!showResult) {
      handleSubmit();
    }
  };

  const handleUseLifeline = async (lifelineType) => {
    if (progress.coins < 10) {
      alert('Not enough coins! You need 10 coins to use a lifeline.');
      return;
    }

    try {
      const response = await axios.post('/api/quiz/use-lifeline', {
        language,
        level: levelNum,
        questionId: question.id,
        lifelineType
      });

      setProgress(prev => ({ ...prev, coins: response.data.coins }));
      setSelectedLifeline(lifelineType);

      if (lifelineType === 'fifty_fifty') {
        setRemovedOptions(response.data.lifelineData.removedIndices);
      } else if (lifelineType === 'swap_question') {
        setQuestion(response.data.lifelineData.newQuestion);
        setAnswer('');
        setCode('');
        if (config.hasTimer) {
          setTimeLeft(config.timeLimit);
        }
      }
    } catch (error) {
      console.error('Error using lifeline:', error);
      alert(error.response?.data?.message || 'Failed to use lifeline');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] flex items-center justify-center">
        <div className="text-white text-xl">Loading question...</div>
      </div>
    );
  }

  if (isDisqualified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Disqualified</h1>
          <p className="text-white mb-4">You have been disqualified due to multiple violations.</p>
          <button
            onClick={() => navigate('/quiz')}
            className="px-6 py-3 bg-[#14A44D] text-white rounded-lg hover:bg-[#0d7a3a]"
          >
            Back to Quiz Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white p-6">
      <BackButton />
      <AntiCheatOverlay
        isEnabled={antiCheatEnabled}
        fairnessScore={fairnessScore}
        penalties={penalties}
        isDisqualified={isDisqualified}
      />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#14A44D]">
              {language.toUpperCase()} - Level {level}
            </h1>
            <p className="text-gray-400">
              {config.type === 'mcq' && 'Multiple Choice Question'}
              {config.type === 'output_prediction' && 'Output Prediction'}
              {config.type === 'short_code' && 'Short Coding Challenge'}
              {config.type === 'full_problem' && 'Full Coding Problem'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="bg-white/10 px-6 py-3 rounded-lg">
              <div className="text-sm text-gray-400">
                {config.hasTimer ? 'Time Left' : 'Elapsed Time'}
              </div>
              <div className={`text-2xl font-bold ${config.hasTimer && timeLeft < 10 ? 'text-red-500' : 'text-white'
                }`}>
                {config.hasTimer ? formatTime(timeLeft) : formatTime(elapsedTime)}
              </div>
            </div>

            {/* Coins */}
            <div className="bg-yellow-500/20 px-6 py-3 rounded-lg">
              <div className="text-sm text-gray-400">Coins</div>
              <div className="text-2xl font-bold text-yellow-500">
                {progress?.coins || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{question?.question}</h2>

          {question?.codeExample && (
            <pre className="bg-black/50 p-4 rounded-lg mb-4 overflow-x-auto">
              <code className="text-green-400">{question.codeExample}</code>
            </pre>
          )}

          {/* MCQ Options */}
          {config.type === 'mcq' && question?.options && (
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setAnswer(index)}
                  disabled={removedOptions.includes(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${removedOptions.includes(index)
                    ? 'opacity-30 cursor-not-allowed bg-gray-800 border-gray-700'
                    : answer === index
                      ? 'border-[#14A44D] bg-[#14A44D]/20'
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
                >
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Code Editor */}
          {(config.type === 'short_code' || config.type === 'full_problem') && (
            <div className="space-y-4">
              <Suspense fallback={
                <div className="h-[400px] bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="text-white">Loading editor...</div>
                </div>
              }>
                <Editor
                  height="400px"
                  language={language === 'cpp' ? 'cpp' : language}
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
              </Suspense>

              <div className="flex gap-3">
                <button
                  onClick={handleRunCode}
                  disabled={executing}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {executing ? 'Running...' : 'Run Code'}
                </button>
              </div>

              {/* Test Results */}
              {testResults && (
                <div className="bg-black/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Test Results:</h3>
                  <div className="space-y-2">
                    {testResults.results.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded ${result.passed ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Test Case {idx + 1}</span>
                          <span className={result.passed ? 'text-green-500' : 'text-red-500'}>
                            {result.passed ? '✓ Passed' : '✗ Failed'}
                          </span>
                        </div>
                        {!result.passed && result.error && (
                          <div className="text-sm text-red-400 mt-2">{result.error}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-gray-400">
                    Passed: {testResults.passedCount}/{testResults.totalTestCases}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lifelines */}
        {config.type === 'mcq' && (
          <div className="bg-white/5 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">KBC Lifelines (10 coins each)</h3>
            <div className="flex gap-4">
              <button
                onClick={() => handleUseLifeline('fifty_fifty')}
                disabled={selectedLifeline === 'fifty_fifty' || progress?.coins < 10}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                50-50
              </button>
              <button
                onClick={() => handleUseLifeline('swap_question')}
                disabled={selectedLifeline === 'swap_question' || progress?.coins < 10}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Swap Question
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={showResult}
            className="px-8 py-4 bg-[#14A44D] hover:bg-[#0d7a3a] rounded-lg text-lg font-semibold disabled:opacity-50"
          >
            Submit Answer
          </button>
        </div>

        {/* Result Modal */}
        <AnimatePresence>
          {showResult && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-[#1A1A1A] rounded-lg p-8 max-w-2xl w-full mx-4"
              >
                <h2 className={`text-3xl font-bold mb-4 ${result.isCorrect ? 'text-green-500' : 'text-red-500'
                  }`}>
                  {result.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </h2>

                {result.explanation && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Explanation:</h3>
                    <p className="text-gray-300">{result.explanation}</p>
                  </div>
                )}

                {result.codeExample && (
                  <pre className="bg-black/50 p-4 rounded-lg mb-4 overflow-x-auto">
                    <code className="text-green-400">{result.codeExample}</code>
                  </pre>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/quiz')}
                    className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg"
                  >
                    Back to Quiz Home
                  </button>
                  <button
                    onClick={() => {
                      setShowResult(false);
                      if (result.isCorrect) {
                        navigate(`/quiz/${language}/${levelNum + 1}`);
                      } else {
                        fetchQuestion();
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-[#14A44D] hover:bg-[#0d7a3a] rounded-lg"
                  >
                    {result.isCorrect ? 'Next Level' : 'Try Again'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Anti-Cheat Instructions */}
      <div className="fixed bottom-4 left-4 bg-white/5 rounded-lg p-3 text-xs text-gray-400">
        <div>Shift + C: Enable Anti-Cheat</div>
        <div>Shift + X: Disable Anti-Cheat</div>
      </div>
    </div>
  );
};

export default QuizArena;