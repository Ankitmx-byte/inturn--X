import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VoiceAssistant = ({ 
  enabled, 
  onToggle, 
  text, 
  personaKey, 
  autoPlay = true,
  socket 
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [showControls, setShowControls] = useState(false);
  const [error, setError] = useState(null);
  const [lastSpokenText, setLastSpokenText] = useState('');
  
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      // Cleanup
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    // Auto-play when new text arrives
    if (enabled && autoPlay && text && text !== lastSpokenText) {
      speakText(text);
      setLastSpokenText(text);
    }
  }, [text, enabled, autoPlay]);

  useEffect(() => {
    // Listen for voice data from Socket.io
    if (socket && enabled) {
      socket.on('ai-voice', handleVoiceData);
      socket.on('voice-error', handleVoiceError);

      return () => {
        socket.off('ai-voice', handleVoiceData);
        socket.off('voice-error', handleVoiceError);
      };
    }
  }, [socket, enabled]);

  const handleVoiceData = (data) => {
    if (data.audioData.type === 'audio') {
      // Play audio from server (base64)
      playAudioData(data.audioData);
    } else if (data.audioData.type === 'browser') {
      // Use browser TTS with config
      speakWithConfig(data.audioData.text, data.audioData.config);
    }
  };

  const handleVoiceError = (error) => {
    console.error('Voice error from server:', error);
    setError('Voice generation failed');
    setTimeout(() => setError(null), 3000);
  };

  const speakText = async (textToSpeak) => {
    if (!textToSpeak || !enabled) return;

    try {
      setError(null);
      
      // Try Socket.io first for server-side TTS
      if (socket) {
        socket.emit('request-voice', {
          text: textToSpeak,
          personaKey: personaKey
        });
      } else {
        // Fallback to browser TTS
        speakWithBrowserTTS(textToSpeak);
      }
    } catch (err) {
      console.error('Speech error:', err);
      setError('Failed to speak');
      setTimeout(() => setError(null), 3000);
    }
  };

  const speakWithBrowserTTS = (textToSpeak) => {
    if (!synthRef.current) {
      console.error('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;

    // Get appropriate voice based on persona
    const voices = synthRef.current.getVoices();
    const voiceConfig = getVoiceForPersona(personaKey, voices);
    
    if (voiceConfig.voice) {
      utterance.voice = voiceConfig.voice;
    }
    
    utterance.pitch = voiceConfig.pitch * 1.0;
    utterance.rate = rate;
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setError('Speech failed');
      setTimeout(() => setError(null), 3000);
    };

    synthRef.current.speak(utterance);
  };

  const speakWithConfig = (textToSpeak, config) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voices = synthRef.current.getVoices();
    
    // Try to match voice from config
    const voice = voices.find(v => 
      v.name.toLowerCase().includes(config.voice.split('_')[0])
    ) || voices[0];
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;
    utterance.volume = config.volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setError('Speech failed');
      setTimeout(() => setError(null), 3000);
    };

    synthRef.current.speak(utterance);
  };

  const playAudioData = (audioData) => {
    try {
      const audioBlob = base64ToBlob(audioData.data, `audio/${audioData.format}`);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.volume = volume;
      
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setError('Audio playback failed');
        setTimeout(() => setError(null), 3000);
      };

      audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      setError('Playback failed');
      setTimeout(() => setError(null), 3000);
    }
  };

  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const getVoiceForPersona = (persona, voices) => {
    const personaVoiceMap = {
      rahul: { gender: 'male', pitch: 1.0 },
      priya: { gender: 'female', pitch: 1.1 },
      karan: { gender: 'male', pitch: 1.05 },
      aditi: { gender: 'female', pitch: 1.0 }
    };

    const config = personaVoiceMap[persona] || personaVoiceMap.rahul;
    
    // Try to find a matching voice
    const voice = voices.find(v => {
      const name = v.name.toLowerCase();
      if (config.gender === 'male') {
        return name.includes('male') || name.includes('david') || name.includes('mark');
      } else {
        return name.includes('female') || name.includes('samantha') || name.includes('karen');
      }
    }) || voices[0];

    return {
      voice,
      pitch: config.pitch
    };
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsSpeaking(false);
  };

  const repeatLastQuestion = () => {
    if (lastSpokenText) {
      speakText(lastSpokenText);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Voice Toggle */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
            enabled ? 'bg-gradient-to-r from-[#14A44D] to-[#5F2EEA]' : 'bg-white/20'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium">Voice</span>
          {isSpeaking && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-[#14A44D]"
            >
              🔊
            </motion.div>
          )}
        </div>
      </div>

      {/* Controls Button */}
      {enabled && (
        <button
          onClick={() => setShowControls(!showControls)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Voice Controls"
        >
          ⚙️
        </button>
      )}

      {/* Repeat Button */}
      {enabled && lastSpokenText && (
        <button
          onClick={repeatLastQuestion}
          disabled={isSpeaking}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          title="Repeat Last Question"
        >
          🔁
        </button>
      )}

      {/* Stop Button */}
      {enabled && isSpeaking && (
        <button
          onClick={stopSpeaking}
          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
          title="Stop Speaking"
        >
          ⏹️
        </button>
      )}

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-xs text-red-400"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Controls Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-16 right-4 bg-[#1A1A1A] border border-white/20 rounded-xl p-4 shadow-2xl z-50 min-w-[250px]"
          >
            <h4 className="text-sm font-semibold mb-3">Voice Settings</h4>
            
            {/* Volume Control */}
            <div className="mb-3">
              <label className="text-xs text-gray-400 block mb-1">
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
            <div className="mb-3">
              <label className="text-xs text-gray-400 block mb-1">
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

            <button
              onClick={() => setShowControls(false)}
              className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceAssistant;