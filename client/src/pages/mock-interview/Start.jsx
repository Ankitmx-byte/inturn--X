import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { motion } from 'framer-motion';

const Start = () => {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedTypes, setSelectedTypes] = useState(['HR', 'Technical']);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const interviewTypes = [
    { key: 'HR', label: 'HR & Behavioral', icon: '💼' },
    { key: 'Technical', label: 'Technical Concepts', icon: '🔧' },
    { key: 'DSA', label: 'Data Structures & Algorithms', icon: '🧮' },
    { key: 'Coding', label: 'Coding Problems', icon: '💻' },
    { key: 'System Design', label: 'System Design', icon: '🏗️' }
  ];

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      const response = await axios.get('/api/mock-interview/personas');
      setPersonas(response.data.personas);
      if (response.data.personas.length > 0) {
        setSelectedPersona(response.data.personas[0].key);
      }
    } catch (err) {
      console.error('Failed to load personas:', err);
      setError('Failed to load interviewers. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleStart = async () => {
    if (!selectedPersona || selectedTypes.length === 0) {
      setError('Please select an interviewer and at least one interview type');
      return;
    }

    setStarting(true);
    setError(null);

    try {
      const response = await axios.post('/api/mock-interview/start', {
        personaKey: selectedPersona,
        difficulty,
        types: selectedTypes
      });

      navigate(`/mock-interview/room/${response.data.interview.id}`);
    } catch (err) {
      console.error('Failed to start interview:', err);
      setError(err.response?.data?.error || 'Failed to start interview. Please try again.');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#14A44D] mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading interviewers...</div>
        </div>
      </div>
    );
  }

  const selectedPersonaData = personas.find(p => p.key === selectedPersona);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] bg-clip-text text-transparent">
                Mock Interview Setup
              </h1>
              <p className="text-gray-400 mt-1">Configure your AI-powered interview session</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-8"
          >
            <p className="text-red-200">{error}</p>
          </motion.div>
        )}

        {/* Persona Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-3">👥</span>
            Choose Your Interviewer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {personas.map((persona) => (
              <motion.div
                key={persona.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPersona(persona.key)}
                className={`cursor-pointer bg-white/10 backdrop-blur-xl border-2 rounded-2xl p-6 transition-all duration-300 ${
                  selectedPersona === persona.key
                    ? 'border-[#14A44D] shadow-lg shadow-[#14A44D]/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-5xl mb-3">{persona.avatar}</div>
                  <h3 className="text-xl font-bold mb-1">{persona.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">{persona.title}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {persona.specialization.map((spec, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-[#5F2EEA]/20 text-[#5F2EEA] rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-3">⚡</span>
            Select Difficulty Level
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['easy', 'medium', 'hard'].map((level) => (
              <motion.div
                key={level}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficulty(level)}
                className={`cursor-pointer bg-white/10 backdrop-blur-xl border-2 rounded-2xl p-6 transition-all duration-300 ${
                  difficulty === level
                    ? 'border-[#FF8E53] shadow-lg shadow-[#FF8E53]/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">
                    {level === 'easy' ? '🟢' : level === 'medium' ? '🟡' : '🔴'}
                  </div>
                  <h3 className="text-xl font-bold capitalize">{level}</h3>
                  <p className="text-sm text-gray-400 mt-2">
                    {level === 'easy' && '5 questions, beginner friendly'}
                    {level === 'medium' && '7 questions, intermediate level'}
                    {level === 'hard' && '10 questions, advanced topics'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Interview Type Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-3">📋</span>
            Choose Interview Types
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interviewTypes.map((type) => (
              <motion.div
                key={type.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleType(type.key)}
                className={`cursor-pointer bg-white/10 backdrop-blur-xl border-2 rounded-xl p-4 transition-all duration-300 ${
                  selectedTypes.includes(type.key)
                    ? 'border-[#5F2EEA] shadow-lg shadow-[#5F2EEA]/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="flex items-center">
                  <div className="text-3xl mr-4">{type.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{type.label}</h3>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedTypes.includes(type.key)
                      ? 'border-[#5F2EEA] bg-[#5F2EEA]'
                      : 'border-white/40'
                  }`}>
                    {selectedTypes.includes(type.key) && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Summary & Start Button */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-3">📝</span>
            Interview Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-sm text-gray-400 mb-2">Interviewer</p>
              <p className="text-lg font-semibold">
                {selectedPersonaData?.avatar} {selectedPersonaData?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Difficulty</p>
              <p className="text-lg font-semibold capitalize">{difficulty}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Interview Types</p>
              <p className="text-lg font-semibold">{selectedTypes.join(', ')}</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            disabled={starting || selectedTypes.length === 0}
            className="w-full bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-[#14A44D]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting Interview...
              </span>
            ) : (
              '🚀 Start Mock Interview'
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Start;