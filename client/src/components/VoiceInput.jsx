import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VoiceInput = ({ onTranscript, enabled, isListening, onToggleListening }) => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      setError('Voice input not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Voice recognition started');
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
        onTranscript(newTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (event.error === 'audio-capture') {
        setError('Microphone not found. Please check your device.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow microphone access.');
      } else {
        setError(`Error: ${event.error}`);
      }
      
      setTimeout(() => setError(null), 5000);
    };

    recognition.onend = () => {
      console.log('Voice recognition ended');
      if (isListening && enabled) {
        // Restart if still supposed to be listening
        try {
          recognition.start();
        } catch (e) {
          console.log('Recognition restart failed:', e);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!recognitionRef.current || !isSupported) return;

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
  }, [isListening, enabled, isSupported]);

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    onTranscript('');
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-red-400 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Voice Input Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleListening}
          disabled={!enabled}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            isListening
              ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg shadow-red-500/50'
              : 'bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] hover:shadow-lg hover:shadow-[#14A44D]/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="text-2xl">
            {isListening ? '🎤' : '🎙️'}
          </span>
          <span>
            {isListening ? 'Stop Recording' : 'Start Speaking'}
          </span>
        </button>

        {transcript && (
          <button
            onClick={clearTranscript}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300"
            title="Clear transcript"
          >
            🗑️ Clear
          </button>
        )}
      </div>

      {/* Live Transcript Display */}
      <AnimatePresence>
        {(transcript || interimTranscript || isListening) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4"
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">💬</div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                  Your Answer {isListening && '(Listening...)'}
                </h4>
                <p className="text-white leading-relaxed">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-gray-400 italic">
                      {interimTranscript}
                    </span>
                  )}
                  {isListening && !transcript && !interimTranscript && (
                    <span className="text-gray-500 italic">
                      Start speaking...
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Recording Indicator */}
            {isListening && (
              <div className="mt-3 flex items-center space-x-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-3 h-3 bg-red-500 rounded-full"
                />
                <span className="text-xs text-gray-400">Recording...</span>
              </div>
            )}
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
            className="bg-red-500/20 border border-red-500/50 rounded-xl p-3"
          >
            <p className="text-red-200 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      {!isListening && !transcript && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>Tips for best results:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Speak clearly and at a normal pace</li>
            <li>Use Chrome or Edge browser for best accuracy</li>
            <li>Allow microphone permissions when prompted</li>
            <li>Minimize background noise</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;