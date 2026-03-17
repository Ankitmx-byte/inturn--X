import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { LANGUAGES, MAX_LEVEL } from '../data/quizBank';
import BackButton from './BackButton';
import io from 'socket.io-client';

const QuizHome = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].key);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const { user } = useAuth();

  // Refetch progress when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 Page visible, refreshing progress...');
        fetchProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    fetchProgress(true); // Force refresh on mount

    // Setup Socket.io for real-time progress updates
    if (user?._id) {
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Connected to quiz home socket');
        socket.emit('programmingQuiz:join', { userId: user._id });
      });

      socket.on('programmingQuiz:progressUpdate', (data) => {
        console.log('📊 Progress update received in home:', data);
        // Update progress for the specific language
        setProgress(prev => {
          const updated = {
            ...prev,
            [data.language]: {
              ...(prev[data.language] || {}),
              completedLevels: data.completedLevels,
              currentLevel: data.currentLevel,
              totalScore: data.totalScore,
              coins: data.coins,
              accuracy: data.accuracy || 0
            }
          };
          console.log('🔄 Updated progress state:', updated);
          return updated;
        });
      });

      socket.on('disconnect', () => {
        console.log('❌ Disconnected from quiz home socket');
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      return () => {
        console.log('🔌 Cleaning up socket connection');
        socket.disconnect();
      };
    }
  }, [user]);

  const fetchProgress = async (forceRefresh = false) => {
    try {
      setLoading(true);
      console.log('🔄 Fetching progress...', forceRefresh ? '(Force Refresh)' : '');

      const responses = await Promise.all(
        LANGUAGES.map(lang =>
          axios.get(`/api/quiz/progress/${lang.key}`, {
            params: forceRefresh ? { t: Date.now() } : {} // Cache busting
          }).then(response => {
            console.log(`✅ Progress for ${lang.key}:`, response.data);
            return response;
          }).catch((err) => {
            console.error(`❌ Error fetching progress for ${lang.key}:`, err);
            // Show error to user for debugging
            if (lang.key === selectedLanguage) {
              alert(`Failed to load progress for ${lang.key}: ${err.message}`);
            }
            return {
              data: { currentLevel: 1, completedLevels: 0, totalScore: 0, accuracy: 0, coins: 100 }
            };
          })
        )
      );

      const progressData = {};
      LANGUAGES.forEach((lang, index) => {
        const data = responses[index].data;
        progressData[lang.key] = data;
        console.log(`📊 ${lang.key}: Level ${data.currentLevel}, Completed: ${data.completedLevels}, Score: ${data.totalScore}`);
      });

      setProgress(progressData);
      console.log('✅ All progress loaded:', progressData);
    } catch (error) {
      console.error('❌ Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (language, level) => {
    navigate(`/quiz/${language}/${level}`);
  };

  const handleViewLeaderboard = () => {
    navigate('/quiz/leaderboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] text-white">
        <BackButton />
        <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="h-12 bg-white/10 rounded-lg animate-pulse mb-2 w-96"></div>
            <div className="h-6 bg-white/10 rounded-lg animate-pulse w-64"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-white/10 rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="h-20 bg-white/10 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] text-white">
      <BackButton />
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Programming Quiz Arena
              </h1>
              <p className="text-gray-300 mt-2">Master programming through 100 levels of progressive challenges</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  console.log('🔄 Force refreshing progress...');
                  fetchProgress(true);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Progress
              </button>
              <button
                onClick={handleViewLeaderboard}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors"
              >
                🏆 Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Language Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Choose Your Language</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {LANGUAGES.map((lang) => {
              const langProgress = progress[lang.key] || {
                completedLevels: 0,
                currentLevel: 1,
                totalScore: 0,
                coins: 100
              };
              const completionRate = (langProgress.completedLevels / MAX_LEVEL) * 100;

              return (
                <div
                  key={lang.key}
                  onClick={() => {
                    setSelectedLanguage(lang.key);
                    console.log(`🎯 Selected ${lang.key}, progress:`, langProgress);
                  }}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ${selectedLanguage === lang.key
                    ? 'border-blue-400 bg-blue-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {lang.key === 'javascript' && '🟨'}
                      {lang.key === 'python' && '🐍'}
                      {lang.key === 'cpp' && '⚡'}
                      {lang.key === 'java' && '☕'}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{lang.label}</h3>
                    <div className="text-sm text-gray-300 mb-2">
                      Level {langProgress.currentLevel} / {MAX_LEVEL}
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">
                      {langProgress.totalScore || 0} points • {langProgress.completedLevels} completed
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Level Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">
            {LANGUAGES.find(l => l.key === selectedLanguage)?.label} Levels
          </h2>

          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((level) => {
              const langProgress = progress[selectedLanguage] || {
                completedLevels: 0,
                currentLevel: 1
              };
              const isCompleted = level <= langProgress.completedLevels;
              const isCurrent = level === langProgress.currentLevel;
              const isLocked = level > langProgress.completedLevels + 1;

              let levelType = 'Easy';
              let bgColor = 'bg-green-500';
              if (level >= 31 && level <= 60) {
                levelType = 'Medium';
                bgColor = 'bg-yellow-500';
              } else if (level >= 61 && level <= 85) {
                levelType = 'Upper-Medium';
                bgColor = 'bg-orange-500';
              } else if (level >= 86) {
                levelType = 'Hard';
                bgColor = 'bg-red-500';
              }

              return (
                <button
                  key={level}
                  onClick={() => !isLocked && handleStartQuiz(selectedLanguage, level)}
                  disabled={isLocked}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${isLocked
                    ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed opacity-50'
                    : isCompleted
                      ? 'border-green-400 bg-green-500/20 hover:bg-green-500/30 cursor-pointer'
                      : isCurrent
                        ? 'border-blue-400 bg-blue-500/20 hover:bg-blue-500/30 cursor-pointer animate-pulse'
                        : 'border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold mb-1">{level}</div>
                    <div className={`text-xs px-2 py-1 rounded ${bgColor} text-white`}>
                      {levelType}
                    </div>
                    {isCompleted && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                        <span className="text-xs">✓</span>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                        <span className="text-xs">▶</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Your Progress</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Current Level:</span>
                <span className="font-bold text-blue-400">{progress[selectedLanguage]?.currentLevel || 1}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed Levels:</span>
                <span className="font-bold text-green-400">{progress[selectedLanguage]?.completedLevels || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Score:</span>
                <span className="font-bold">{progress[selectedLanguage]?.totalScore || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Accuracy:</span>
                <span className="font-bold">{Math.round(progress[selectedLanguage]?.accuracy || 0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Coins:</span>
                <span className="font-bold text-yellow-400">🪙 {progress[selectedLanguage]?.coins || 100}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Level Types</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>1-30: MCQ (30s)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>31-60: Output Prediction (60s)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>61-85: Short Coding</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>86-100: Full Coding</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Lifelines</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span>🪙</span>
                <span>Coins: {progress[selectedLanguage]?.coins || 100}</span>
              </div>
              <div className="text-sm text-gray-300">
                Use lifelines during quiz to get hints, remove options, or skip questions
              </div>
            </div>
          </div>
        </div>

        {/* Debug Panel - Remove in production */}
        {import.meta.env.DEV && (
          <div className="mt-8 bg-black/50 backdrop-blur-sm rounded-lg p-6 border border-yellow-500/50">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">🐛 Debug Info</h3>
            <div className="text-xs font-mono">
              <div className="mb-2">
                <strong>Selected Language:</strong> {selectedLanguage}
              </div>
              <div className="mb-2">
                <strong>Progress Data:</strong>
              </div>
              <pre className="bg-black/50 p-4 rounded overflow-auto max-h-60">
                {JSON.stringify(progress[selectedLanguage], null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizHome;
