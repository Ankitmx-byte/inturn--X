import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';

// Home button component
const HomeButton = () => (
  <Link
    to="/"
    className="bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] text-white px-6 py-2 rounded-full hover:shadow-[#14A44D]/40 transition-all duration-300 transform hover:scale-105 font-medium"
  >
    🏠 Home
  </Link>
);

// Progress Overview Component
const ProgressOverview = ({ stats }) => (
  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 mb-8">
    <h3 className="text-xl font-semibold mb-6 flex items-center">
      <span className="mr-3">📊</span>
      Learning Progress Overview
    </h3>
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">Overall Progress</span>
          <span className="text-sm text-[#14A44D] font-semibold">{Math.round((stats.completedCourses / Math.max(stats.completedCourses + 2, 1)) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((stats.completedCourses / Math.max(stats.completedCourses + 2, 1)) * 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-4 bg-white/5 rounded-xl">
          <div className="text-2xl font-bold text-[#14A44D] mb-1">{stats.completedCourses}</div>
          <div className="text-sm text-gray-400">Courses Completed</div>
          <div className="text-xs text-gray-500 mt-1">Keep learning!</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-xl">
          <div className="text-2xl font-bold text-[#5F2EEA] mb-1">{stats.totalProjects}</div>
          <div className="text-sm text-gray-400">Projects Submitted</div>
          <div className="text-xs text-gray-500 mt-1">Great work!</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-xl">
          <div className="text-2xl font-bold text-[#FF4B2B] mb-1">{stats.battlesWon}</div>
          <div className="text-sm text-gray-400">Battles Won</div>
          <div className="text-xs text-gray-500 mt-1">Keep fighting!</div>
        </div>
      </div>
    </div>
  </div>
);

// Achievements component
const AchievementsSection = ({ badges }) => (
  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 mb-8">
    <h3 className="text-xl font-semibold mb-4 flex items-center">
      <span className="mr-3">🏆</span>
      Achievements & Badges
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {badges.length > 0 ? badges.map((badge, index) => (
        <div key={index} className="text-center p-4 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-xl border border-yellow-400/30">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-sm font-medium text-yellow-400">{badge.name || 'Achievement'}</div>
          <div className="text-xs text-gray-400">{badge.date || 'Earned recently'}</div>
        </div>
      )) : (
        <>
          <div className="text-center p-4 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-xl border border-yellow-400/30">
            <div className="text-3xl mb-2">🚀</div>
            <div className="text-sm font-medium text-yellow-400">First Steps</div>
            <div className="text-xs text-gray-400">Complete first course</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-gray-400/20 to-gray-600/20 rounded-xl border border-gray-400/30">
            <div className="text-3xl mb-2">⚔️</div>
            <div className="text-sm font-medium text-gray-400">Battle Ready</div>
            <div className="text-xs text-gray-400">Win first battle</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-gray-400/20 to-gray-600/20 rounded-xl border border-gray-400/30">
            <div className="text-3xl mb-2">🧠</div>
            <div className="text-sm font-medium text-gray-400">Quiz Master</div>
            <div className="text-xs text-gray-400">Score 100% on quiz</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-gray-400/20 to-gray-600/20 rounded-xl border border-gray-400/30">
            <div className="text-3xl mb-2">🚀</div>
            <div className="text-sm font-medium text-gray-400">Project Star</div>
            <div className="text-xs text-gray-400">Submit first project</div>
          </div>
        </>
      )}
    </div>
  </div>
);


const Dashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const [stats, setStats] = useState({
    xp: 0,
    completedCourses: 0,
    badges: [],
    recommendations: [],
    totalProjects: 0,
    internshipsApplied: 0,
    quizScore: 0,
    battlesWon: 0,
    streakDays: 0,
    timeSpent: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user stats, recommendations, and recent activities
        const [statsResponse, recommendationsResponse, recentActivityResponse] = await Promise.all([
          axios.get('/api/auth/profile'),
          axios.get('/api/ai/recommend').catch(() => ({ data: { recommendations: [] } })),
          axios.get('/api/users/recent-activity').catch(() => ({ data: { activities: [] } }))
        ]);

        const userData = statsResponse.data.user;

        setStats({
          xp: userData.xp || 0,
          completedCourses: userData.completedCourses?.length || 0,
          badges: userData.badges || [],
          recommendations: recommendationsResponse.data.recommendations || [],
          totalProjects: userData.totalProjects || 0,
          internshipsApplied: userData.internshipApplications?.length || 0,
          quizScore: userData.quizScore || 0,
          battlesWon: userData.battleWins || 0,
          streakDays: userData.streakDays || 0,
          timeSpent: userData.timeSpent || 0
        });

        setRecentActivities(recentActivityResponse.data.activities || []);

        // Generate mock upcoming deadlines (can be replaced with real data later)
        setUpcomingDeadlines([
          { id: 1, title: 'Machine Learning Project Deadline', date: 'Dec 15, 2024', type: 'project' },
          { id: 2, title: 'Python Advanced Quiz', date: 'Dec 18, 2024', type: 'quiz' },
          { id: 3, title: 'Frontend Internship Application', date: 'Dec 20, 2024', type: 'internship' }
        ]);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Set mock data on error to prevent crash
        setRecentActivities([
          { id: 1, type: 'course', title: 'Completed React Fundamentals', time: '2 hours ago', icon: '📚' },
          { id: 2, type: 'battle', title: 'Won coding battle vs CodeMaster', time: '5 hours ago', icon: '⚔️' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
               <span className="text-gray-300">Welcome, {user?.name}!</span>
               <HomeButton />
               <Link to="/profile" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300 focus:outline-none p-2 rounded-full hover:bg-white/10">
                 <div className="w-8 h-8 bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                   {user?.avatar ? (
                     <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                   ) : (
                     user?.name?.charAt(0)?.toUpperCase() || 'U'
                   )}
                 </div>
               </Link>
               <button
                 onClick={logout}
                 className="bg-gradient-to-r from-[#FF4B2B] to-[#FF8E53] text-white px-6 py-2 rounded-full hover:shadow-[#FF4B2B]/40 transition-all duration-300 transform hover:scale-105"
               >
                 Logout
               </button>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden rounded-2xl shadow-2xl hover:bg-white/15 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#14A44D]/20 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-[#14A44D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">XP Points</dt>
                    <dd className="text-2xl font-bold text-white">{stats.xp}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden rounded-2xl shadow-2xl hover:bg-white/15 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#5F2EEA]/20 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-[#5F2EEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Completed Courses</dt>
                    <dd className="text-2xl font-bold text-white">{stats.completedCourses}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden rounded-2xl shadow-2xl hover:bg-white/15 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#FF4B2B]/20 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-[#FF4B2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Projects Submitted</dt>
                    <dd className="text-2xl font-bold text-white">{stats.totalProjects}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden rounded-2xl shadow-2xl hover:bg-white/15 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#FF8E53]/20 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-[#FF8E53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Internship Applications</dt>
                    <dd className="text-2xl font-bold text-white">{stats.internshipsApplied}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row of Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden rounded-2xl shadow-2xl hover:bg-white/15 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Quiz Score</dt>
                    <dd className="text-2xl font-bold text-white">{stats.quizScore}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden rounded-2xl shadow-2xl hover:bg-white/15 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Battles Won</dt>
                    <dd className="text-2xl font-bold text-white">{stats.battlesWon}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden rounded-2xl shadow-2xl hover:bg-white/15 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#FF4B2B]/20 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-[#FF4B2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Learning Streak</dt>
                    <dd className="text-2xl font-bold text-white">{stats.streakDays} days</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden rounded-2xl shadow-2xl hover:bg-white/15 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#14A44D]/20 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-[#14A44D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Time Spent</dt>
                    <dd className="text-2xl font-bold text-white">{stats.timeSpent}h</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <ProgressOverview stats={stats} />

        {/* Recent Activity & Upcoming Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Activity */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-3">📈</span>
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="text-2xl">{activity.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{activity.title}</div>
                    <div className="text-xs text-gray-400">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-3">⏰</span>
              Upcoming Deadlines
            </h3>
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div>
                    <div className="text-sm font-medium text-white">{deadline.title}</div>
                    <div className="text-xs text-gray-400">{deadline.date}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    deadline.type === 'project' ? 'bg-[#FF4B2B]/20 text-[#FF4B2B]' :
                    deadline.type === 'quiz' ? 'bg-[#5F2EEA]/20 text-[#5F2EEA]' :
                    'bg-[#14A44D]/20 text-[#14A44D]'
                  }`}>
                    {deadline.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Link
            to="/learning"
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105 hover:shadow-[#14A44D]/20 group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-[#14A44D]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#14A44D]/30 transition-colors duration-300">
                <svg className="h-8 w-8 text-[#14A44D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#14A44D] transition-colors duration-300">Continue Learning</h3>
              <p className="text-gray-400 text-sm mb-2">{stats.completedCourses} courses completed</p>
              <div className="text-xs text-[#14A44D] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Start new course →
              </div>
            </div>
          </Link>

          <Link
            to="/battle"
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105 hover:shadow-[#5F2EEA]/20 group"
          >
            <div className="text-center">
              <div className="relative w-16 h-16 bg-[#5F2EEA]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#5F2EEA]/30 transition-colors duration-300">
                <svg className="h-8 w-8 text-[#5F2EEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {stats.battlesWon > 0 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-black">
                    {stats.battlesWon}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#5F2EEA] transition-colors duration-300">Code Battle</h3>
              <p className="text-gray-400 text-sm mb-2">Rank #{Math.floor(Math.random() * 100) + 1} globally</p>
              <div className="text-xs text-[#5F2EEA] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Join competition →
              </div>
            </div>
          </Link>

          <Link
            to="/projects"
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105 hover:shadow-[#FF4B2B]/20 group"
          >
            <div className="text-center">
              <div className="relative w-16 h-16 bg-[#FF4B2B]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#FF4B2B]/30 transition-colors duration-300">
                <svg className="h-8 w-8 text-[#FF4B2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {stats.totalProjects > 0 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#FF4B2B] rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {stats.totalProjects}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#FF4B2B] transition-colors duration-300">My Projects</h3>
              <p className="text-gray-400 text-sm mb-2">{stats.totalProjects} projects submitted</p>
              <div className="text-xs text-[#FF4B2B] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                View submissions →
              </div>
            </div>
          </Link>

          <Link
            to="/internships"
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105 hover:shadow-[#14A44D]/20 group"
          >
            <div className="text-center">
              <div className="relative w-16 h-16 bg-[#14A44D]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#14A44D]/30 transition-colors duration-300">
                <svg className="h-8 w-8 text-[#14A44D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8" />
                </svg>
                {stats.internshipsApplied > 0 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#14A44D] rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {stats.internshipsApplied}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#14A44D] transition-colors duration-300">Internships</h3>
              <p className="text-gray-400 text-sm mb-2">{stats.internshipsApplied} applications sent</p>
              <div className="text-xs text-[#14A44D] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Find opportunities →
              </div>
            </div>
          </Link>

          <Link
            to="/mock-interview/start"
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105 hover:shadow-[#FF8E53]/20 group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FF8E53]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#FF8E53]/30 transition-colors duration-300">
                <svg className="h-8 w-8 text-[#FF8E53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#FF8E53] transition-colors duration-300">Mock Interview</h3>
              <p className="text-gray-400 text-sm mb-2">AI Interviewer</p>
              <div className="text-xs text-[#FF8E53] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Practice interview →
              </div>
            </div>
          </Link>

          <Link
            to="/quiz"
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl hover:bg-white/15 transition-all duration-300 transform hover:scale-105 hover:shadow-[#5F2EEA]/20 group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-[#5F2EEA]/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#5F2EEA]/30 transition-colors duration-300">
                <svg className="h-8 w-8 text-[#5F2EEA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#5F2EEA] transition-colors duration-300">Programming Quiz</h3>
              <p className="text-gray-400 text-sm mb-2">Level {Math.max(1, Math.min(5, Math.floor(stats.quizScore / 20)))} unlocked</p>
              <div className="text-xs text-[#5F2EEA] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Challenge yourself →
              </div>
            </div>
          </Link>
        </div>

        {/* Achievements Section */}
        <AchievementsSection badges={stats.badges} />

        {/* AI Recommendations */}
        {stats.recommendations.length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
            <div className="px-6 py-5">
              <h3 className="text-xl leading-6 font-medium text-white mb-4 flex items-center">
                <span className="mr-3">🤖</span>
                AI Personalized Recommendations
              </h3>
              <div className="space-y-4">
                {stats.recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all duration-300">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-1">{rec.title}</h4>
                      <p className="text-sm text-gray-300 mb-2">{rec.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>Duration: {rec.duration || '4 weeks'}</span>
                        <span>Level: {rec.level || 'Beginner'}</span>
                        <span className="flex items-center">
                          ⭐ {rec.rating || 4.8} ({rec.students || 1200} students)
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/course/${rec.id}`}
                      className="bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] text-white px-6 py-3 rounded-full hover:shadow-[#14A44D]/40 transition-all duration-300 transform hover:scale-105 font-medium ml-4"
                    >
                      Start Learning
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
