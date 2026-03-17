import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import LearningHub from './components/LearningHub';
import BattleArena from './components/BattleArena';
import CourseDetail from './components/CourseDetail';
import AIMentor from './components/AIMentor';
import Projects from './components/Projects';
import Internships from './components/Internships';
import Community from './components/Community';
import AdminPanel from './components/AdminPanel';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import MockInterviewStart from './pages/mock-interview/Start';
import MockInterviewRoom from './pages/mock-interview/Room';
import MockInterviewResult from './pages/mock-interview/Result';
import QuizHome from './components/QuizHome';
import QuizArena from './pages/quiz/QuizArena';
import Leaderboard from './components/Leaderboard';
import CoursesPage from './pages/learning/CoursesPage';
import Certificate from './components/Certificate';
import ApiTest from './components/ApiTest';
import ProfilePage from './components/ProfilePage';
import ResumeBuilder from './components/ResumeBuilder';
import AuthCallback from './components/AuthCallback';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#14A44D] mx-auto mb-4"></div>
          <div className="text-white text-lg font-semibold">Loading InturnX...</div>
          <div className="text-gray-400 text-sm mt-2">Please wait while we prepare your experience</div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#14A44D] mx-auto mb-4"></div>
          <div className="text-white text-lg font-semibold">Loading InturnX...</div>
          <div className="text-gray-400 text-sm mt-2">Please wait while we prepare your experience</div>
        </div>
      </div>
    );
  }

  // Redirect authenticated users to dashboard from login/signup pages
  if (isAuthenticated && (window.location.pathname === '/login' || window.location.pathname === '/signup')) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />

            {/* Landing page route for authenticated users */}
            <Route
              path="/home"
              element={<Home />}
            />

            {/* OAuth callback route */}
            <Route
              path="/auth/callback"
              element={<AuthCallback />}
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learning"
              element={
                <ProtectedRoute>
                  <LearningHub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/battle"
              element={
                <ProtectedRoute>
                  <BattleArena />
                </ProtectedRoute>
              }
            />
            <Route
              path="/course/:id"
              element={
                <ProtectedRoute>
                  <CourseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor"
              element={
                <ProtectedRoute>
                  <AIMentor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/internships"
              element={
                <ProtectedRoute>
                  <Internships />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community"
              element={
                <ProtectedRoute>
                  <Community />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mock-interview/start"
              element={
                <ProtectedRoute>
                  <MockInterviewStart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mock-interview/room/:id"
              element={
                <ProtectedRoute>
                  <MockInterviewRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mock-interview/result/:id"
              element={
                <ProtectedRoute>
                  <MockInterviewResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz"
              element={
                <ProtectedRoute>
                  <QuizHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:language"
              element={
                <ProtectedRoute>
                  <QuizHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:language/:level"
              element={
                <ProtectedRoute>
                  <QuizArena />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learning/courses"
              element={
                <ProtectedRoute>
                  <CoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/leaderboard"
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/certificate/:language"
              element={
                <ProtectedRoute>
                  <Certificate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume-builder"
              element={
                <ProtectedRoute>
                  <ResumeBuilder />
                </ProtectedRoute>
              }
            />

            {/* API Test route */}
            <Route path="/api-test" element={<ApiTest />} />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
