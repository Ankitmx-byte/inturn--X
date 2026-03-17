import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const PENALTIES = {
  tab_switch: 15,
  window_blur: 15,
  visibility_change: 10,
  resize: 5,
  devtools_open: 20,
  copy_attempt: 10,
  paste_attempt: 10,
  cut_attempt: 10,
  context_menu: 5,
  camera_blocked: 40,
  multiple_faces: 50,
  no_face_detected: 30
};

export const useAntiCheat = (sessionId, sessionType, userId) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [fairnessScore, setFairnessScore] = useState(100);
  const [penalties, setPenalties] = useState([]);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const socketRef = useRef(null);
  const listenersAttached = useRef(false);

  useEffect(() => {
    // Connect to socket
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');
    socketRef.current = socket;

    // Listen for fairness updates
    socket.on('antiCheat:fairnessUpdate', (data) => {
      setFairnessScore(data.currentScore);
      setPenalties(data.penalties);
      setIsDisqualified(data.isDisqualified);
    });

    socket.on('antiCheat:disqualify', (data) => {
      setIsDisqualified(true);
      alert(`You have been disqualified: ${data.reason}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const logEvent = useCallback((eventType, metadata = {}) => {
    if (!isEnabled || !socketRef.current) return;

    socketRef.current.emit('antiCheat:event', {
      userId,
      sessionId,
      sessionType,
      eventType,
      metadata
    });
  }, [isEnabled, sessionId, sessionType, userId]);

  const enableAntiCheat = useCallback(() => {
    if (isEnabled) return;

    setIsEnabled(true);
    
    if (socketRef.current) {
      socketRef.current.emit('antiCheat:enabled', { sessionId, userId });
    }

    // Attach event listeners
    if (!listenersAttached.current) {
      attachEventListeners();
      listenersAttached.current = true;
    }
  }, [isEnabled, sessionId, userId]);

  const disableAntiCheat = useCallback(() => {
    if (!isEnabled) return;

    setIsEnabled(false);
    
    if (socketRef.current) {
      socketRef.current.emit('antiCheat:disabled', { sessionId, userId });
    }

    // Remove event listeners
    if (listenersAttached.current) {
      removeEventListeners();
      listenersAttached.current = false;
    }
  }, [isEnabled, sessionId, userId]);

  const attachEventListeners = () => {
    // Block copy, paste, cut
    const handleCopy = (e) => {
      e.preventDefault();
      logEvent('copy_attempt');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      logEvent('paste_attempt');
    };

    const handleCut = (e) => {
      e.preventDefault();
      logEvent('cut_attempt');
    };

    // Block context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      logEvent('context_menu');
    };

    // Detect tab switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logEvent('visibility_change');
      }
    };

    const handleBlur = () => {
      logEvent('window_blur');
    };

    // Detect window resize
    const handleResize = () => {
      logEvent('resize');
    };

    // Detect DevTools
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        logEvent('devtools_open');
      }
    };

    // Block keyboard shortcuts
    const handleKeyDown = (e) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
        (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
        (e.ctrlKey && e.keyCode === 85) // Ctrl+U
      ) {
        e.preventDefault();
        logEvent('devtools_open');
      }

      // Block Ctrl+S (save)
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
      }

      // Block Ctrl+P (print)
      if (e.ctrlKey && e.keyCode === 80) {
        e.preventDefault();
      }
    };

    // Attach all listeners
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyDown);

    // DevTools detection interval
    const devToolsInterval = setInterval(detectDevTools, 1000);

    // Store cleanup functions
    window._antiCheatCleanup = () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(devToolsInterval);
    };
  };

  const removeEventListeners = () => {
    if (window._antiCheatCleanup) {
      window._antiCheatCleanup();
      delete window._antiCheatCleanup;
    }
  };

  // Keyboard shortcut handlers
  useEffect(() => {
    const handleShortcut = (e) => {
      // Shift + C = Enable Anti-Cheat
      if (e.shiftKey && e.key === 'C') {
        e.preventDefault();
        enableAntiCheat();
      }

      // Shift + X = Disable Anti-Cheat
      if (e.shiftKey && e.key === 'X') {
        e.preventDefault();
        disableAntiCheat();
      }
    };

    document.addEventListener('keydown', handleShortcut);

    return () => {
      document.removeEventListener('keydown', handleShortcut);
    };
  }, [enableAntiCheat, disableAntiCheat]);

  return {
    isEnabled,
    fairnessScore,
    penalties,
    isDisqualified,
    enableAntiCheat,
    disableAntiCheat,
    logEvent
  };
};