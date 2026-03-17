import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AntiCheatOverlay = ({ isEnabled, fairnessScore, penalties, isDisqualified }) => {
  if (!isEnabled) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    if (score >= 40) return 'bg-orange-500/20';
    return 'bg-red-500/20';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50"
      >
        <div className={`${getScoreBg(fairnessScore)} backdrop-blur-md rounded-lg p-4 border border-white/10 shadow-2xl min-w-[250px]`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-semibold">Anti-Cheat Active</span>
            </div>
            <span className="text-xs text-gray-400">Shift+X to disable</span>
          </div>

          {/* Fairness Score */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">Fairness Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(fairnessScore)}`}>
                {fairnessScore}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${fairnessScore}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full ${
                  fairnessScore >= 80 ? 'bg-green-500' :
                  fairnessScore >= 60 ? 'bg-yellow-500' :
                  fairnessScore >= 40 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
              />
            </div>
          </div>

          {/* Penalties */}
          {penalties.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              <span className="text-xs text-gray-400">Recent Violations:</span>
              {penalties.slice(-3).reverse().map((penalty, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-red-400 flex items-center justify-between bg-red-500/10 rounded px-2 py-1"
                >
                  <span>{penalty.description}</span>
                  <span className="font-semibold">-{penalty.points}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Warning */}
          {fairnessScore < 40 && !isDisqualified && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 bg-red-500/20 border border-red-500/50 rounded p-2"
            >
              <p className="text-xs text-red-400 font-semibold">
                ⚠️ Warning: Low fairness score! You may be disqualified.
              </p>
            </motion.div>
          )}

          {/* Disqualified */}
          {isDisqualified && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 bg-red-600 rounded p-3 text-center"
            >
              <p className="text-white font-bold text-sm">DISQUALIFIED</p>
              <p className="text-xs text-red-200 mt-1">Too many violations detected</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AntiCheatOverlay;