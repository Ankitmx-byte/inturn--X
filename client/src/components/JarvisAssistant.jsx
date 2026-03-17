import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const JarvisAssistant = ({ 
  enabled, 
  onToggle, 
  text, 
  personaKey,
  onUserSpeech,
  socket 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [conversationMode, setConversationMode] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [showControls, setShowControls] = useState(false);
  const [error, setError] = useState(null);
  const [lastSpokenText, setLastSpokenText] = useState('');
  const [visualizer, setVisualizer] = useState([]);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const utteranceRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('JARVIS listening...');
        setError(null);
      };

      recognition.onresult = (event) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalText += transcriptPiece + ' ';
          } else {
            interimText += transcriptPiece;
          }
        }

        setInterimTranscript(interimText);
        
        if (finalText) {
          const newTranscript = transcript + finalText;
          setTranscript(newTranscript);
          
          // Send to parent component
          if (onUserSpeech) {
            onUserSpeech(newTranscript);
          }
          
          // In conversation mode, process the speech
          if (conversationMode) {
            processUserSpeech(finalText.trim());
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          setError('No speech detected.');
        } else if (event.error === 'audio-capture') {
          setError('Microphone not found.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone permission denied.');
        } else {
          setError(`Error: ${event.error}`);
        }
        
        setTimeout(() => setError(null), 3000);
      };

      recognition.onend = () => {
        if (isListening && enabled) {
          try {
            recognition.start();
          } catch (e) {
            console.log('Recognition restart:', e);
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-speak when new text arrives
    if (enabled && text && text !== lastSpokenText) {
      speakText(text);
      setLastSpokenText(text);
    }
  }, [text, enabled]);

  useEffect(() => {
    // Control listening state
    if (!recognitionRef.current) return;

    if (isListening && enabled) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        if (e.name !== 'InvalidStateError') {
          console.error('Failed to start recognition:', e);
        }
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Stop recognition error:', e);
      }
    }
  }, [isListening, enabled]);

  const processUserSpeech = async (speech) => {
    const lowerSpeech = speech.toLowerCase();
    
    // Check for special commands first
    if (lowerSpeech.includes('repeat') || lowerSpeech.includes('say again')) {
      if (lastSpokenText) {
        speakText(lastSpokenText);
      }
      return;
    }
    
    // Send to JARVIS AI for processing
    if (socket) {
      socket.emit('jarvis-chat', {
        sessionId: `interview_${Date.now()}`, // Use interview ID if available
        message: speech,
        context: {
          personaName: personaKey,
          interviewType: 'Mock Interview',
          currentQuestion: text
        }
      });
    } else {
      // Fallback if no socket connection
      respondToUser("I apologize, Sir. I'm currently offline. Please check your connection.");
    }
  };

  const respondToUser = (response) => {
    speakText(response);
  };

  // Listen for JARVIS AI responses
  useEffect(() => {
    if (!socket) return;

    const handleJarvisResponse = (data) => {
      if (data.response) {
        respondToUser(data.response);
        
        // Show indicator if using fallback
        if (data.fallback) {
          console.log('Using fallback response');
        }
      }
    };

    socket.on('jarvis-response', handleJarvisResponse);

    return () => {
      socket.off('jarvis-response', handleJarvisResponse);
    };
  }, [socket]);

  const speakText = (textToSpeak) => {
    if (!textToSpeak || !enabled || !synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;

    // Get appropriate voice
    const voices = synthRef.current.getVoices();
    const voiceConfig = getVoiceForPersona(personaKey, voices);
    
    if (voiceConfig.voice) {
      utterance.voice = voiceConfig.voice;
    }
    
    utterance.pitch = voiceConfig.pitch;
    utterance.rate = rate;
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsSpeaking(true);
      startVisualizer();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      stopVisualizer();
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event);
      setIsSpeaking(false);
      stopVisualizer();
    };

    synthRef.current.speak(utterance);
  };

  const getVoiceForPersona = (persona, voices) => {
    // Try to get a more natural, professional voice
    const preferredVoices = [
      'Google UK English Male',
      'Google US English',
      'Microsoft David',
      'Microsoft Mark',
      'Alex',
      'Daniel'
    ];

    let selectedVoice = voices.find(v => 
      preferredVoices.some(pv => v.name.includes(pv))
    );

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    }

    return {
      voice: selectedVoice,
      pitch: 0.95 // Slightly lower pitch for professional tone
    };
  };

  const startVisualizer = () => {
    const bars = Array.from({ length: 20 }, () => Math.random() * 100);
    setVisualizer(bars);
    
    const animate = () => {
      if (isSpeaking) {
        const newBars = Array.from({ length: 20 }, () => Math.random() * 100);
        setVisualizer(newBars);
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setVisualizer([]);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  const toggleConversationMode = () => {
    setConversationMode(!conversationMode);
    if (!conversationMode) {
      setIsListening(true);
      respondToUser("Conversation mode activated, Sir. I'm listening and ready to assist.");
    } else {
      setIsListening(false);
      respondToUser("Conversation mode deactivated. Standing by.");
      
      // Clear conversation history
      if (socket) {
        socket.emit('jarvis-clear', { sessionId: `interview_${Date.now()}` });
      }
    }
  };

  const getQuickTip = (category) => {
    if (socket) {
      socket.emit('jarvis-tip', { category });
      
      socket.once('jarvis-tip', (data) => {
        if (data.tip) {
          respondToUser(data.tip);
        }
      });
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
    stopVisualizer();
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  return (
    <div className="space-y-4">
      {/* Main Control Panel */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <motion.div
                animate={isSpeaking ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
              >
                <span className="text-2xl">🤖</span>
              </motion.div>
              
              {(isSpeaking || isListening) && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                />
              )}
            </div>
            
            <div>
              <h3 className="font-bold text-lg">JARVIS AI Assistant</h3>
              <p className="text-xs text-gray-400">
                {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Ready'}
              </p>
            </div>
          </div>

          <button
            onClick={onToggle}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              enabled 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                : 'bg-white/10 text-gray-400'
            }`}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Audio Visualizer */}
        {enabled && isSpeaking && (
          <div className="mb-4 flex items-center justify-center space-x-1 h-16">
            {visualizer.map((height, index) => (
              <motion.div
                key={index}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.1 }}
                className="w-1 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full"
                style={{ minHeight: '10%' }}
              />
            ))}
          </div>
        )}

        {/* Controls */}
        {enabled && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={toggleListening}
              disabled={conversationMode}
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                isListening && !conversationMode
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 shadow-lg shadow-red-500/50'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg'
              } disabled:opacity-50`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>{isListening && !conversationMode ? '🎤' : '🎙️'}</span>
                <span className="text-sm">
                  {isListening && !conversationMode ? 'Stop' : 'Listen'}
                </span>
              </div>
            </button>

            <button
              onClick={toggleConversationMode}
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                conversationMode
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/50'
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>💬</span>
                <span className="text-sm">
                  {conversationMode ? 'Active' : 'Converse'}
                </span>
              </div>
            </button>

            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl transition-all duration-300"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>⏹️</span>
                  <span className="text-sm">Stop</span>
                </div>
              </button>
            )}

            {lastSpokenText && (
              <button
                onClick={() => speakText(lastSpokenText)}
                disabled={isSpeaking}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 disabled:opacity-50"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>🔁</span>
                  <span className="text-sm">Repeat</span>
                </div>
              </button>
            )}

            <button
              onClick={() => setShowControls(!showControls)}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300"
            >
              <div className="flex items-center justify-center space-x-2">
                <span>⚙️</span>
                <span className="text-sm">Settings</span>
              </div>
            </button>
          </div>
        )}

        {/* Transcript Display */}
        <AnimatePresence>
          {enabled && (transcript || interimTranscript) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-400">Your Speech</h4>
                <button
                  onClick={clearTranscript}
                  className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
                >
                  Clear
                </button>
              </div>
              <p className="text-white leading-relaxed text-sm">
                {transcript}
                {interimTranscript && (
                  <span className="text-gray-400 italic">
                    {interimTranscript}
                  </span>
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3"
            >
              <p className="text-red-200 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl p-4 space-y-4"
            >
              <h4 className="text-sm font-semibold mb-3">Voice Settings</h4>
              
              {/* Volume Control */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">
                  Volume: {Math.round(volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Speed Control */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">
                  Speed: {rate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Tips */}
        {enabled && !isListening && !isSpeaking && (
          <div className="mt-4 space-y-3">
            <div className="text-xs text-gray-500 space-y-1">
              <p>💡 <strong>Voice Commands:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>"Hey JARVIS" - Start conversation</li>
                <li>"Repeat" - Repeat last question</li>
                <li>"Help me with..." - Get specific help</li>
                <li>"Give me a tip" - Get interview advice</li>
                <li>"I'm ready" - Confirm readiness</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => getQuickTip('technical')}
                className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-xs transition-all"
              >
                💻 Technical Tip
              </button>
              <button
                onClick={() => getQuickTip('behavioral')}
                className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-xs transition-all"
              >
                🎯 Behavioral Tip
              </button>
              <button
                onClick={() => getQuickTip('coding')}
                className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-xs transition-all"
              >
                ⌨️ Coding Tip
              </button>
              <button
                onClick={() => getQuickTip('general')}
                className="px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg text-xs transition-all"
              >
                📚 General Tip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JarvisAssistant;