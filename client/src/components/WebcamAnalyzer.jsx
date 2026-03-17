import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

const WebcamAnalyzer = ({ enabled, onToggle, onAnalysisUpdate }) => {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState({
    posture: { score: 0, status: 'neutral', feedback: 'Waiting for analysis...' },
    eyeContact: { score: 0, status: 'neutral', feedback: 'Waiting for analysis...' },
    facialExpression: { score: 0, status: 'neutral', feedback: 'Waiting for analysis...' },
    headPosition: { score: 0, status: 'neutral', feedback: 'Waiting for analysis...' },
    overallPresence: { score: 0, status: 'neutral' }
  });
  const [showFeedback, setShowFeedback] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  const analysisDataRef = useRef({
    faceDetected: false,
    eyeGaze: { x: 0, y: 0 },
    headAngle: { pitch: 0, yaw: 0, roll: 0 },
    shoulderAlignment: 0,
    posture: 'neutral',
    lastUpdate: Date.now()
  });

  useEffect(() => {
    if (enabled && isActive) {
      initializeMediaPipe();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [enabled, isActive]);

  // Analyze data every 2 seconds
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const newAnalysis = calculateAnalysis();
      setAnalysis(newAnalysis);
      
      if (onAnalysisUpdate) {
        onAnalysisUpdate(newAnalysis);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  const initializeMediaPipe = async () => {
    try {
      // Initialize Face Mesh
      faceMeshRef.current = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      faceMeshRef.current.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMeshRef.current.onResults(onFaceMeshResults);

      // Initialize Pose
      poseRef.current = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      poseRef.current.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      poseRef.current.onResults(onPoseResults);

      // Start webcam
      await startWebcam();
    } catch (err) {
      console.error('MediaPipe initialization error:', err);
      setError('Failed to initialize AI analysis. Using basic detection.');
      await startWebcam(); // Fallback to basic webcam
    }
  };

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsAnalyzing(true);
          
          // Start MediaPipe camera if initialized
          if (faceMeshRef.current && poseRef.current) {
            cameraRef.current = new Camera(videoRef.current, {
              onFrame: async () => {
                if (faceMeshRef.current && videoRef.current) {
                  await faceMeshRef.current.send({ image: videoRef.current });
                }
                if (poseRef.current && videoRef.current) {
                  await poseRef.current.send({ image: videoRef.current });
                }
              },
              width: 1280,
              height: 720
            });
            cameraRef.current.start();
          }
        };
      }

      setError(null);
    } catch (err) {
      console.error('Webcam error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a webcam.');
      } else {
        setError('Failed to access camera. Please check your device.');
      }
      setIsActive(false);
    }
  };

  const stopWebcam = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setIsAnalyzing(false);
  };

  const onFaceMeshResults = (results) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      analysisDataRef.current.faceDetected = false;
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    analysisDataRef.current.faceDetected = true;

    // Calculate eye gaze direction
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const noseTip = landmarks[1];
    
    // Eye gaze estimation (simplified)
    const eyeCenter = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2
    };
    
    analysisDataRef.current.eyeGaze = {
      x: eyeCenter.x - 0.5, // Normalized to center
      y: eyeCenter.y - 0.5
    };

    // Head angle estimation
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const forehead = landmarks[10];
    const chin = landmarks[152];
    
    // Calculate yaw (left-right rotation)
    const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
    const leftDistance = Math.abs(noseTip.x - leftCheek.x);
    const rightDistance = Math.abs(noseTip.x - rightCheek.x);
    const yaw = ((leftDistance - rightDistance) / faceWidth) * 90; // Approximate angle
    
    // Calculate pitch (up-down rotation)
    const faceHeight = Math.abs(chin.y - forehead.y);
    const noseToForehead = Math.abs(noseTip.y - forehead.y);
    const pitch = ((noseToForehead / faceHeight) - 0.5) * 60; // Approximate angle
    
    analysisDataRef.current.headAngle = {
      pitch: pitch,
      yaw: yaw,
      roll: 0 // Roll is harder to calculate accurately
    };

    analysisDataRef.current.lastUpdate = Date.now();
  };

  const onPoseResults = (results) => {
    if (!results.poseLandmarks) {
      return;
    }

    const landmarks = results.poseLandmarks;
    
    // Get shoulder landmarks
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const nose = landmarks[0];
    
    if (leftShoulder && rightShoulder && nose) {
      // Calculate shoulder alignment (should be horizontal)
      const shoulderAngle = Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x
      ) * (180 / Math.PI);
      
      analysisDataRef.current.shoulderAlignment = Math.abs(shoulderAngle);
      
      // Check if person is centered and upright
      const shoulderMidpoint = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      
      const isUpright = nose.y < shoulderMidpoint.y - 0.1; // Nose should be above shoulders
      const isCentered = Math.abs(shoulderMidpoint.x - 0.5) < 0.2; // Within 20% of center
      
      if (isUpright && isCentered) {
        analysisDataRef.current.posture = 'good';
      } else if (isUpright || isCentered) {
        analysisDataRef.current.posture = 'fair';
      } else {
        analysisDataRef.current.posture = 'poor';
      }
    }
  };

  const calculateAnalysis = () => {
    const data = analysisDataRef.current;
    
    if (!data.faceDetected) {
      return {
        posture: { score: 0, status: 'poor', feedback: '❌ No face detected. Please position yourself in front of camera.' },
        eyeContact: { score: 0, status: 'poor', feedback: '❌ Face not visible.' },
        facialExpression: { score: 0, status: 'poor', feedback: '❌ Face not visible.' },
        headPosition: { score: 0, status: 'poor', feedback: '❌ Face not visible.' },
        overallPresence: { score: 0, status: 'poor' }
      };
    }

    // Posture Score (based on shoulder alignment and body position)
    let postureScore = 100;
    if (data.shoulderAlignment > 15) {
      postureScore -= (data.shoulderAlignment - 15) * 2;
    }
    if (data.posture === 'fair') postureScore -= 20;
    if (data.posture === 'poor') postureScore -= 40;
    postureScore = Math.max(0, Math.min(100, postureScore));
    
    const postureStatus = postureScore > 70 ? 'good' : postureScore > 40 ? 'fair' : 'poor';
    const postureFeedback = postureScore > 70 
      ? '✅ Excellent posture! Keep sitting upright.'
      : postureScore > 40
      ? '⚠️ Sit up straighter. Center yourself in frame.'
      : '❌ Poor posture detected. Sit upright and face the camera.';

    // Eye Contact Score (based on gaze direction)
    const gazeDistance = Math.sqrt(data.eyeGaze.x ** 2 + data.eyeGaze.y ** 2);
    let eyeContactScore = Math.max(0, 100 - (gazeDistance * 200));
    eyeContactScore = Math.max(0, Math.min(100, eyeContactScore));
    
    const eyeContactStatus = eyeContactScore > 70 ? 'good' : eyeContactScore > 40 ? 'fair' : 'poor';
    const eyeContactFeedback = eyeContactScore > 70
      ? '✅ Great eye contact! Looking at camera.'
      : eyeContactScore > 40
      ? '⚠️ Try to look at the camera more often.'
      : '❌ Maintain eye contact with the camera.';

    // Head Position Score (based on head angles)
    let headScore = 100;
    const pitchDeviation = Math.abs(data.headAngle.pitch);
    const yawDeviation = Math.abs(data.headAngle.yaw);
    
    if (pitchDeviation > 15) headScore -= (pitchDeviation - 15) * 2;
    if (yawDeviation > 15) headScore -= (yawDeviation - 15) * 2;
    headScore = Math.max(0, Math.min(100, headScore));
    
    const headStatus = headScore > 70 ? 'good' : headScore > 40 ? 'fair' : 'poor';
    const headFeedback = headScore > 70
      ? '✅ Perfect head position!'
      : headScore > 40
      ? '⚠️ Adjust camera height. Keep head straight.'
      : '❌ Reposition camera. Your face should be clearly visible.';

    // Facial Expression Score (based on face detection quality and positioning)
    // This is simplified - in production, you'd use emotion detection
    let expressionScore = 75; // Base score when face is detected
    if (gazeDistance < 0.15) expressionScore += 15; // Bonus for looking at camera
    if (data.posture === 'good') expressionScore += 10; // Bonus for good posture
    expressionScore = Math.max(0, Math.min(100, expressionScore));
    
    const expressionStatus = expressionScore > 70 ? 'good' : expressionScore > 40 ? 'fair' : 'poor';
    const expressionFeedback = expressionScore > 70
      ? '✅ Good facial expression! Confident and engaged.'
      : expressionScore > 40
      ? '⚠️ Try to appear more engaged and confident.'
      : '❌ Smile and show engagement. Look confident!';

    // Overall Score
    const overallScore = Math.round((postureScore + eyeContactScore + expressionScore + headScore) / 4);
    const overallStatus = overallScore > 70 ? 'excellent' : overallScore > 50 ? 'good' : overallScore > 30 ? 'fair' : 'poor';

    return {
      posture: { score: Math.round(postureScore), status: postureStatus, feedback: postureFeedback },
      eyeContact: { score: Math.round(eyeContactScore), status: eyeContactStatus, feedback: eyeContactFeedback },
      facialExpression: { score: Math.round(expressionScore), status: expressionStatus, feedback: expressionFeedback },
      headPosition: { score: Math.round(headScore), status: headStatus, feedback: headFeedback },
      overallPresence: { score: overallScore, status: overallStatus }
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return 'text-green-400';
      case 'fair':
        return 'text-yellow-400';
      case 'poor':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return 'bg-green-500/20 border-green-500/50';
      case 'fair':
        return 'bg-yellow-500/20 border-yellow-500/50';
      case 'poor':
        return 'bg-red-500/20 border-red-500/50';
      default:
        return 'bg-gray-500/20 border-gray-500/50';
    }
  };

  const toggleWebcam = () => {
    setIsActive(!isActive);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Webcam Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
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
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">AI Interview Coach</span>
            {isAnalyzing && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-green-400"
              >
                📹
              </motion.div>
            )}
          </div>
        </div>

        {enabled && isActive && (
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            {showFeedback ? 'Hide' : 'Show'} Metrics
          </button>
        )}
      </div>

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

      {/* Webcam View and Analysis */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-1 flex flex-col space-y-4"
          >
            {/* Start/Stop Button */}
            {!isActive && (
              <button
                onClick={toggleWebcam}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#14A44D] to-[#5F2EEA] rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span className="text-2xl">📹</span>
                <span>Start Camera Analysis</span>
              </button>
            )}

            {isActive && (
              <div className="flex-1 flex flex-col space-y-4">
                {/* Video Feed */}
                <div className="relative flex-1">
                  <div className="bg-black rounded-xl overflow-hidden border-2 border-white/20 h-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Recording Indicator */}
                    <div className="absolute top-3 left-3 flex items-center space-x-2 bg-black/70 px-3 py-1 rounded-full">
                      <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-2 h-2 bg-red-500 rounded-full"
                      />
                      <span className="text-xs text-white">Live Analysis</span>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="absolute top-3 right-3 bg-black/70 px-4 py-2 rounded-xl">
                      <div className="text-xs text-gray-400">Overall</div>
                      <div className={`text-2xl font-bold ${getStatusColor(analysis.overallPresence.status)}`}>
                        {analysis.overallPresence.score}%
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={toggleWebcam}
                    className="mt-3 w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all duration-300"
                  >
                    Stop Camera
                  </button>
                </div>

                {/* Real-time Feedback */}
                {showFeedback && (
                  <div className="space-y-2">
                    {/* Posture */}
                    <div className={`p-2 rounded-lg border ${getStatusBg(analysis.posture.status)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">🧍 Posture</span>
                        <span className={`text-xs font-bold ${getStatusColor(analysis.posture.status)}`}>
                          {analysis.posture.score}%
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-300">{analysis.posture.feedback}</p>
                    </div>

                    {/* Eye Contact */}
                    <div className={`p-2 rounded-lg border ${getStatusBg(analysis.eyeContact.status)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">👁️ Eye Contact</span>
                        <span className={`text-xs font-bold ${getStatusColor(analysis.eyeContact.status)}`}>
                          {analysis.eyeContact.score}%
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-300">{analysis.eyeContact.feedback}</p>
                    </div>

                    {/* Facial Expression */}
                    <div className={`p-2 rounded-lg border ${getStatusBg(analysis.facialExpression.status)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">😊 Expression</span>
                        <span className={`text-xs font-bold ${getStatusColor(analysis.facialExpression.status)}`}>
                          {analysis.facialExpression.score}%
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-300">{analysis.facialExpression.feedback}</p>
                    </div>

                    {/* Head Position */}
                    <div className={`p-2 rounded-lg border ${getStatusBg(analysis.headPosition.status)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">📐 Head Position</span>
                        <span className={`text-xs font-bold ${getStatusColor(analysis.headPosition.status)}`}>
                          {analysis.headPosition.score}%
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-300">{analysis.headPosition.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hidden canvas for analysis */}
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WebcamAnalyzer;