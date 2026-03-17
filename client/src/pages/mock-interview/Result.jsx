import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { motion } from 'framer-motion';

const Result = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadResults();
  }, [id]);

  const loadResults = async () => {
    try {
      const response = await axios.get(`/api/mock-interview/${id}`);
      setInterview(response.data.interview);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load results:', err);
      setError('Failed to load interview results.');
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!interview?.pdfUrl) {
      setError('PDF report is not available yet');
      return;
    }

    try {
      setDownloading(true);
      const response = await axios.get(interview.pdfUrl, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `interview_report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setError('Failed to download PDF report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#14A44D] mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading results...</div>
        </div>
      </div>
    );
  }

  const evaluation = interview?.evaluation || {};
  const sections = evaluation.sections || {};

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'from-green-500/20 to-green-600/20 border-green-500/50';
    if (score >= 60) return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50';
    return 'from-red-500/20 to-red-600/20 border-red-500/50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] text-white">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] bg-clip-text text-transparent">
                Interview Results
              </h1>
              <p className="text-gray-400 mt-1">
                Completed on {new Date(interview?.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/mock-interview/start')}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300"
              >
                New Interview
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] rounded-full hover:shadow-lg transition-all duration-300"
              >
                Dashboard
              </button>
            </div>
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

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`bg-gradient-to-br ${getScoreBg(evaluation.overallScore || 0)} border-2 rounded-3xl p-12 mb-8 text-center`}
        >
          <div className="text-7xl font-bold mb-4 bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] bg-clip-text text-transparent">
            {evaluation.overallScore || 0}/100
          </div>
          <div className="text-2xl font-semibold mb-2">Overall Performance</div>
          <div className="text-gray-400">
            {evaluation.overallScore >= 80 && 'Excellent! You performed very well.'}
            {evaluation.overallScore >= 60 && evaluation.overallScore < 80 && 'Good job! Keep practicing to improve.'}
            {evaluation.overallScore < 60 && 'Keep learning! Practice makes perfect.'}
          </div>
        </motion.div>

        {/* Section Scores */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Performance Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(sections).map(([key, score]) => (
              score > 0 && (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                      {score}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </motion.div>
              )
            ))}
          </div>
        </div>

        {/* Analysis */}
        {evaluation.analysis && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3">📝</span>
              Detailed Analysis
            </h2>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
              <p className="text-gray-300 leading-relaxed">{evaluation.analysis}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Strengths */}
          {evaluation.strengths && evaluation.strengths.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="mr-3">💪</span>
                Key Strengths
              </h2>
              <div className="space-y-3">
                {evaluation.strengths.map((strength, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-green-500/10 border-l-4 border-green-500 rounded-lg p-4"
                  >
                    <p className="text-gray-300">{strength}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="mr-3">📈</span>
                Areas for Improvement
              </h2>
              <div className="space-y-3">
                {evaluation.weaknesses.map((weakness, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-orange-500/10 border-l-4 border-orange-500 rounded-lg p-4"
                  >
                    <p className="text-gray-300">{weakness}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {evaluation.recommendations && evaluation.recommendations.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3">🎯</span>
              Recommendations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluation.recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#5F2EEA]/10 border-l-4 border-[#5F2EEA] rounded-lg p-4"
                >
                  <p className="text-gray-300">{rec}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Coding Results */}
        {interview?.coding?.code && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="mr-3">💻</span>
              Coding Round Results
            </h2>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#14A44D] mb-2">
                    {interview.coding.passCount}/{interview.coding.passCount + interview.coding.failCount}
                  </div>
                  <div className="text-sm text-gray-400">Test Cases Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#5F2EEA] mb-2">
                    {interview.coding.runtime}ms
                  </div>
                  <div className="text-sm text-gray-400">Runtime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#FF8E53] mb-2">
                    {interview.coding.language}
                  </div>
                  <div className="text-sm text-gray-400">Language</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Download PDF */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadPDF}
            disabled={downloading || !interview?.pdfUrl}
            className="px-8 py-4 bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-[#14A44D]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </span>
            ) : (
              '📄 Download PDF Report'
            )}
          </motion.button>
          {!interview?.pdfUrl && (
            <p className="text-sm text-gray-400 mt-4">
              PDF report will be available shortly
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Result;