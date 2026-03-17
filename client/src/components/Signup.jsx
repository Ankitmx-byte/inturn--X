import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Animations removed as requested
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    const result = await signup(formData.name, formData.email, formData.password);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] px-4">
      <div className="signup-card bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-10 w-full max-w-md text-center text-white shadow-2xl">
        <h2 className="text-3xl font-bold mb-2">Join InturnX 🚀</h2>
        <p className="text-gray-300 mb-8">Start your AI-powered learning journey today</p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => { const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001'); window.location.href = `${API}/api/auth/github`; }}
            className="w-full py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>Continue with GitHub</span>
          </button>

          <button
            onClick={() => { const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001'); window.location.href = `${API}/api/auth/google`; }}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            onClick={() => { const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001'); window.location.href = `${API}/api/auth/linkedin`; }}
            className="w-full py-3 bg-blue-800 text-white rounded-xl font-semibold hover:bg-blue-900 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span>Continue with LinkedIn</span>
          </button>
        </div>

        <div className="flex items-center mb-6">
          <div className="flex-1 border-t border-white/20"></div>
          <span className="px-4 text-gray-400 text-sm">or</span>
          <div className="flex-1 border-t border-white/20"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="input w-full p-4 bg-white/30 border border-white/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D] focus:border-transparent transition-all duration-300"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input w-full p-4 bg-white/30 border border-white/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D] focus:border-transparent transition-all duration-300"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="input w-full p-4 bg-white/30 border border-white/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D] focus:border-transparent transition-all duration-300"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="input w-full p-4 bg-white/30 border border-white/40 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14A44D] focus:border-transparent transition-all duration-300"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#FF4B2B] to-[#5F2EEA] rounded-xl font-semibold text-white hover:shadow-[#14A44D]/40 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-8 text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="text-[#14A44D] font-semibold hover:text-[#14A44D]/80 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
