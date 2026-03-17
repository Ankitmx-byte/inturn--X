import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import Editor from '@monaco-editor/react';
import axios from '../utils/axios';
import BackButton from './BackButton';
import antiCheatSystem from '../../../antiCheat/antiCheat.js';
import antiCheatLogger from '../../../antiCheat/logger.js';
import KeyboardShortcuts from '../../../antiCheat/keyboardShortcuts.js';

const BattleArena = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('1v1');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);
  const [battleState, setBattleState] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [opponent, setOpponent] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [practiceProblem, setPracticeProblem] = useState(null);
  const [practiceDifficulty, setPracticeDifficulty] = useState(null);
  const [practiceTopic, setPracticeTopic] = useState(null);
  const [loadingPractice, setLoadingPractice] = useState(false);
  const [solvedQuestions, setSolvedQuestions] = useState([]);
  const [antiCheatEnabled, setAntiCheatEnabled] = useState(false);
  const [devMode, setDevMode] = useState(localStorage.getItem('devMode') === 'true');

  const timerRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL);
    setSocket(newSocket);

    // Initialize anti-cheat system
    if (antiCheatSystem && antiCheatSystem.initialize) {
      antiCheatSystem.initialize(newSocket);
    }
    if (antiCheatLogger && antiCheatLogger.initialize) {
      antiCheatLogger.initialize(newSocket);
    }
    if (KeyboardShortcuts && KeyboardShortcuts.initialize) {
      KeyboardShortcuts.initialize(antiCheatSystem, antiCheatLogger);
    }

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    // Queue events
    newSocket.on('queue-joined', (data) => {
      setQueueStatus({ status: 'joined', ...data });
    });

    newSocket.on('queue-left', () => {
      setQueueStatus(null);
    });

    newSocket.on('matchmaking-status', (data) => {
      setQueueStatus(data);
    });

    newSocket.on('match-found', async (data) => {
      setQueueStatus(null);
      setBattleState({
        battleId: data.battleId,
        problem: data.problem,
        timeLimit: data.timeLimit,
        yourTurn: data.yourTurn,
        status: 'active'
      });
      setOpponent(data.opponent);
      setTimeLeft(data.timeLimit);
      setCode(data.problem.languages?.[language]?.template || '');
      startTimer(data.timeLimit);
      
      // Enable anti-cheat for 1v1 battle
      if (antiCheatSystem && antiCheatSystem.enable) {
        await antiCheatSystem.enable();
        setAntiCheatEnabled(true);
        console.log('Anti-cheat enabled for 1v1 battle');
      }
    });

    // Battle events
    newSocket.on('code-updated', (data) => {
      if (data.from !== newSocket.id) {
        setCode(data.code);
        setLanguage(data.language);
      }
    });

    newSocket.on('opponent-submitted', (data) => {
      // Handle opponent submission notification
      console.log('Opponent submitted:', data);
    });

    newSocket.on('submission-received', (data) => {
      setIsSubmitting(false);
      console.log('Submission received:', data);
    });

    newSocket.on('battle-result', (data) => {
      setBattleResult(data);
      setShowResultModal(true);
      setBattleState(prev => ({ ...prev, status: 'completed' }));
      clearInterval(timerRef.current);
      
      // Disable anti-cheat when battle ends
      if (antiCheatSystem && antiCheatSystem.disable) {
        antiCheatSystem.disable();
        setAntiCheatEnabled(false);
        console.log('Anti-cheat disabled - battle ended');
      }
    });

    // Anti-cheat events (for debugging - not shown to users)
    newSocket.on('anti-cheat-log', (data) => {
      console.log('Anti-Cheat Log:', data);
    });

    return () => {
      newSocket.close();
      // Cleanup anti-cheat system
      KeyboardShortcuts.destroy();
    };
  }, []);

  // Load leaderboard data
  useEffect(() => {
    if (activeTab === 'leaderboard' && leaderboard.length === 0) {
      loadLeaderboard();
    }
  }, [activeTab]);

  // Load user stats
  useEffect(() => {
    if (activeTab === 'stats' && !userStats) {
      loadUserStats();
    }
    if (activeTab === 'practice') {
      loadSolvedQuestions();
    }
  }, [activeTab, user]);

  const loadSolvedQuestions = async () => {
    try {
      const response = await axios.get(`/api/quiz/progress/${language}`);
      setSolvedQuestions(response.data.solvedQuestions || []);
    } catch (error) {
      console.error('Error loading solved questions:', error);
    }
  };

  // Start battle timer
  const startTimer = (duration) => {
    setTimeLeft(duration);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Join queue
  const joinQueue = (battleType) => {
    if (socket && user) {
      socket.emit('join-queue', {
        userId: user.id,
        userName: user.name,
        battleType,
        rating: user.rating || 1200
      });
    }
  };

  // Leave queue
  const leaveQueue = () => {
    if (socket && user) {
      socket.emit('leave-queue', { userId: user.id });
    }
  };

  // Join battle room
  useEffect(() => {
    if (battleState?.battleId && socket) {
      socket.emit('join-battle', battleState.battleId);
    }
  }, [battleState?.battleId, socket]);

  // Handle code changes
  const handleCodeChange = (value) => {
    setCode(value);
    if (socket && battleState?.battleId) {
      socket.emit('code-update', {
        battleId: battleState.battleId,
        code: value,
        language
      });
    }
  };

  // Submit solution
  const submitSolution = async () => {
    if (!battleState?.battleId || !code.trim()) return;

    setIsSubmitting(true);
    socket.emit('submit-solution', {
      battleId: battleState.battleId,
      code,
      language
    });
  };

  // Load leaderboard
  const loadLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const response = await axios.get('/api/battles/leaderboard');
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Load user stats
  const loadUserStats = async () => {
    if (!user?.id) return;

    setLoadingStats(true);
    try {
      const response = await axios.get('/api/battles/stats');
      setUserStats(response.data.stats || null);
    } catch (error) {
      console.error('Error loading user stats:', error);
      setUserStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  // Start practice session
  const startPractice = async (difficulty, topic = null) => {
    setLoadingPractice(true);
    setPracticeDifficulty(difficulty);
    setPracticeTopic(topic);
    try {
      const params = new URLSearchParams({ difficulty });
      if (topic) params.append('topic', topic);
      const response = await axios.get(`/api/battles/practice?${params.toString()}`);
      setPracticeProblem(response.data.problem);
      setCode(response.data.problem.languages?.[language]?.template || '');
      setActiveTab('practice'); // Stay on practice tab
      
      // Enable anti-cheat for practice mode
      if (antiCheatSystem && antiCheatSystem.enable) {
        await antiCheatSystem.enable();
        setAntiCheatEnabled(true);
        console.log('Anti-cheat enabled for practice mode');
      }
    } catch (error) {
      console.error('Error starting practice:', error);
    } finally {
      setLoadingPractice(false);
    }
  };

  // Submit practice solution
  const submitPracticeSolution = async () => {
    if (!practiceProblem || !code.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/battles/practice/submit', {
        problemId: practiceProblem.id,
        code,
        language
      });

      // Handle practice result
      console.log('Practice submission result:', response.data);
      // You can add a modal or notification here for practice results
      
      // Disable anti-cheat after submission
      if (antiCheatSystem && antiCheatSystem.disable) {
        antiCheatSystem.disable();
        setAntiCheatEnabled(false);
        console.log('Anti-cheat disabled after practice submission');
      }
    } catch (error) {
      console.error('Error submitting practice solution:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get rank color
  const getRankColor = (rank) => {
    const colors = {
      'Beginner': '#96CEB4',
      'Intermediate': '#5F2EEA',
      'Advanced': '#FF4B2B',
      'Expert': '#14A44D',
      'Master': '#FFD700',
      'Grandmaster': '#FF6B6B'
    };
    return colors[rank] || '#96CEB4';
  };

  // Determine status banner text
  const statusText = (() => {
    if (queueStatus?.status === 'joined') return '🔍 Searching for Opponent...';
    if (queueStatus?.status === 'searching') return `🔍 Searching... (${queueStatus.playersInQueue} in queue)`;
    if (battleState?.status === 'active') return '⚔️ Battle in Progress!';
    if (battleState?.status === 'completed') return '🏆 Battle Completed!';
    if (activeTab === 'practice' && !practiceProblem) return '🎯 Practice Mode - Select Topic & Difficulty';
    if (!queueStatus && !battleState && activeTab !== 'practice') return '🎯 Battle Arena Ready!';
    return '';
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white">
      <BackButton />
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Battle Arena
              </h1>
              <p className="text-gray-400 mt-2">Compete in real-time coding battles</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-2">
                <span className="text-sm text-gray-400">Rating: </span>
                <span className="text-[#14A44D] font-semibold">{user?.rating || 1200}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-2">
                <span className="text-sm text-gray-400">Rank: </span>
                <span style={{ color: getRankColor(user?.rank || 'Beginner') }} className="font-semibold">
                  {user?.rank || 'Beginner'}
                </span>
              </div>
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <div className="mb-4 text-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <div className="text-2xl font-bold text-green-400 mb-2">
            {statusText}
          </div>
          {battleState?.status === 'active' && (
            <div className="text-lg text-gray-300 mb-4">
              Time Left: <span className="text-red-400 font-mono">{formatTime(timeLeft)}</span>
            </div>
          )}
          <div className="flex justify-center space-x-4 text-sm text-gray-400">
            <span>⚡ Real-time competition</span>
            <span>•</span>
            <span>🧠 AI-powered problems</span>
            <span>•</span>
            <span>🏆 Global rankings</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1">
          {[
            { id: '1v1', name: '1v1 Battles', disabled: battleState?.status === 'active' },
            { id: 'practice', name: 'Practice Mode', disabled: battleState?.status === 'active' },
            { id: 'leaderboard', name: 'Leaderboard' },
            { id: 'stats', name: 'My Stats' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* 1v1 Battles Tab */}
        {activeTab === '1v1' && (
          <div className="space-y-8">
            {!battleState && !queueStatus && (
              <div className="text-center">
                <button
                  onClick={() => joinQueue('competitive')}
                  className="bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  🤝 Join Competitive Queue
                </button>
              </div>
            )}

            {queueStatus && (
              <div className="text-center">
                <button
                  onClick={leaveQueue}
                  className="bg-red-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  🚪 Leave Queue
                </button>
              </div>
            )}

            {battleState?.status === 'active' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Problem Section */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4">{battleState.problem.title}</h3>
                  <div className="text-sm text-gray-400 mb-2">
                    Difficulty: <span className={`px-2 py-1 rounded ${
                      battleState.problem.difficulty === 'Easy' ? 'bg-green-600' :
                      battleState.problem.difficulty === 'Medium' ? 'bg-yellow-600' : 'bg-red-600'
                    }`}>{battleState.problem.difficulty}</span>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 mb-4">{battleState.problem.description}</p>

                    {battleState.problem.examples && battleState.problem.examples.map((example, idx) => (
                      <div key={idx} className="bg-black/30 p-4 rounded-lg mb-4">
                        <div className="font-semibold mb-2">Example {idx + 1}:</div>
                        <div className="text-sm">
                          <div><strong>Input:</strong> {example.input}</div>
                          <div><strong>Output:</strong> {example.output}</div>
                          {example.explanation && <div><strong>Explanation:</strong> {example.explanation}</div>}
                        </div>
                      </div>
                    ))}

                    {battleState.problem.constraints && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Constraints:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-400">
                          {battleState.problem.constraints.map((constraint, idx) => (
                            <li key={idx}>{constraint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Code Editor Section */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  {/* Anti-Cheat Status Indicator */}
                  {antiCheatEnabled && (
                    <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-400 font-medium">
                        🛡️ Anti-Cheat Active - Your session is being monitored
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Code Editor</h3>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-black/30 border border-white/20 rounded-lg px-3 py-1 text-sm"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>

                  <div className="h-96 mb-4">
                    <Editor
                      height="100%"
                      language={language}
                      value={code}
                      onChange={handleCodeChange}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                      Opponent: {opponent?.userName} ({opponent?.rating})
                    </div>
                    <button
                      onClick={submitSolution}
                      disabled={isSubmitting || !code.trim()}
                      className="bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Solution'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Practice Mode Tab */}
        {activeTab === 'practice' && (
          <div className="space-y-8">
            {!practiceProblem && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">🎯 Practice Mode</h2>
                <p className="text-gray-400 mb-8">Solve coding problems without time pressure</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🟢</div>
                      <h3 className="text-xl font-bold mb-2">Easy Problems</h3>
                      <p className="text-gray-400 mb-4">Perfect for beginners</p>
                      <button
                        onClick={() => startPractice('easy')}
                        disabled={loadingPractice}
                        className={`${solvedQuestions.includes(practiceProblem?.id) ? 'bg-green-600' : 'bg-gray-600'} text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50`}
                      >
                        {loadingPractice ? 'Loading...' : solvedQuestions.includes(practiceProblem?.id) ? 'Unlocked' : 'Start Easy'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🟡</div>
                      <h3 className="text-xl font-bold mb-2">Medium Problems</h3>
                      <p className="text-gray-400 mb-4">Build your skills</p>
                      <button
                        onClick={() => startPractice('medium')}
                        disabled={loadingPractice}
                        className={`${solvedQuestions.includes(practiceProblem?.id) ? 'bg-green-600' : 'bg-yellow-600'} text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50`}
                      >
                        {loadingPractice ? 'Loading...' : solvedQuestions.includes(practiceProblem?.id) ? 'Unlocked' : 'Start Medium'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🔴</div>
                      <h3 className="text-xl font-bold mb-2">Hard Problems</h3>
                      <p className="text-gray-400 mb-4">Challenge yourself</p>
                      <button
                        onClick={() => startPractice('hard')}
                        disabled={loadingPractice}
                        className={`${solvedQuestions.includes(practiceProblem?.id) ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50`}
                      >
                        {loadingPractice ? 'Loading...' : solvedQuestions.includes(practiceProblem?.id) ? 'Unlocked' : 'Start Hard'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4">Recent Practice Sessions</h3>
                  <div className="text-center text-gray-400">
                    No recent practice sessions
                  </div>
                </div>
              </div>
            )}

            {practiceProblem && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">🎯 Practice Mode</h2>
                  <button
                    onClick={() => {
                      setPracticeProblem(null);
                      setCode('');
                      setPracticeDifficulty(null);
                      
                      // Disable anti-cheat when exiting practice
                      if (antiCheatSystem && antiCheatSystem.disable) {
                        antiCheatSystem.disable();
                        setAntiCheatEnabled(false);
                        console.log('Anti-cheat disabled - exited practice mode');
                      }
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    ← Back to Selection
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Problem Section */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4">{practiceProblem.title}</h3>
                    <div className="text-sm text-gray-400 mb-2">
                      Difficulty: <span className={`px-2 py-1 rounded ${
                        practiceProblem.difficulty === 'Easy' ? 'bg-green-600' :
                        practiceProblem.difficulty === 'Medium' ? 'bg-yellow-600' : 'bg-red-600'
                      }`}>{practiceProblem.difficulty}</span>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300 mb-4">{practiceProblem.description}</p>

                      {practiceProblem.examples && practiceProblem.examples.map((example, idx) => (
                        <div key={idx} className="bg-black/30 p-4 rounded-lg mb-4">
                          <div className="font-semibold mb-2">Example {idx + 1}:</div>
                          <div className="text-sm">
                            <div><strong>Input:</strong> {example.input}</div>
                            <div><strong>Output:</strong> {example.output}</div>
                            {example.explanation && <div><strong>Explanation:</strong> {example.explanation}</div>}
                          </div>
                        </div>
                      ))}

                      {practiceProblem.constraints && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Constraints:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-400">
                            {practiceProblem.constraints.map((constraint, idx) => (
                              <li key={idx}>{constraint}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Code Editor Section */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                    {/* Anti-Cheat Status Indicator */}
                    {antiCheatEnabled && (
                      <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-400 font-medium">
                          🛡️ Anti-Cheat Active - Your session is being monitored
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Code Editor</h3>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-black/30 border border-white/20 rounded-lg px-3 py-1 text-sm"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                      </select>
                    </div>

                    <div className="h-96 mb-4">
                      <Editor
                        height="100%"
                        language={language}
                        value={code}
                        onChange={(value) => setCode(value)}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
                          roundedSelection: false,
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                        }}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={submitPracticeSolution}
                        disabled={isSubmitting || !code.trim()}
                        className="bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Solution'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-8">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">🏆 Global Leaderboard</h2>
                <p className="text-gray-400">Top competitive programmers</p>
              </div>
              {loadingLeaderboard ? (
                <div className="text-center text-gray-300">
                  Loading leaderboard...
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-4">
                  {leaderboard.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between bg-black/30 p-4 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                        <div>
                          <div className="font-semibold">{player.name}</div>
                          <div className="text-sm text-gray-400">{player.rank}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[#14A44D]">{player.rating}</div>
                        <div className="text-sm text-gray-400">{player.winRate}% WR</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-300">
                  No leaderboard data available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingStats ? (
              <>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 animate-pulse">
                    <div className="text-center">
                      <div className="h-8 bg-gray-600 rounded mb-2"></div>
                      <div className="h-4 bg-gray-600 rounded"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : userStats ? (
              <>
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#14A44D] mb-2">{userStats.totalBattles || 0}</div>
                    <div className="text-gray-400">Total Battles</div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#14A44D] mb-2">{userStats.wins || 0}</div>
                    <div className="text-gray-400">Wins</div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#FF4B2B] mb-2">{userStats.losses || 0}</div>
                    <div className="text-gray-400">Losses</div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#5F2EEA] mb-2">{userStats.winRate || 0}%</div>
                    <div className="text-gray-400">Win Rate</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="col-span-full text-center text-gray-300">
                No stats available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Battle Result Modal */}
      {showResultModal && battleResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">
                {battleResult.result === 'player1_win' && battleResult.player1.userName === user?.name ? '🏆' :
                 battleResult.result === 'player2_win' && battleResult.player2.userName === user?.name ? '🏆' : '🤝'}
              </div>
              <h3 className="text-2xl font-bold mb-2">Battle Complete!</h3>
              <div className="text-gray-300">
                {battleResult.result === 'draw' ? 'It\'s a Draw!' :
                 battleResult.player1.userName === user?.name ?
                 (battleResult.result === 'player1_win' ? 'You Won!' : 'You Lost!') :
                 (battleResult.result === 'player2_win' ? 'You Won!' : 'You Lost!')}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span>{battleResult.player1.userName}</span>
                <span className={`font-semibold ${battleResult.player1.ratingChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {battleResult.player1.ratingChange >= 0 ? '+' : ''}{battleResult.player1.ratingChange}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{battleResult.player2.userName}</span>
                <span className={`font-semibold ${battleResult.player2.ratingChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {battleResult.player2.ratingChange >= 0 ? '+' : ''}{battleResult.player2.ratingChange}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowResultModal(false);
                setBattleState(null);
                setBattleResult(null);
                setOpponent(null);
                setCode('');
              }}
              className="w-full bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleArena;
