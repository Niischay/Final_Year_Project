import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { enrollFace } from '../api/authService';
import useAuth from '../hooks/useAuth';
import './FaceEnrollment.css';

const FaceEnrollment = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureStatus, setCaptureStatus] = useState('Loading AI models...');
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Load Models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; 
      try {
        console.log("Loading models from:", MODEL_URL);

        await Promise.all([
         faceapi.loadSsdMobilenetv1Model(MODEL_URL),
          faceapi.loadFaceLandmarkModel(MODEL_URL),
          faceapi.loadFaceRecognitionModel(MODEL_URL)
        ]);

        console.log("Models loaded successfully");

        setModelsLoaded(true);
        setCaptureStatus('Starting camera...');
        startVideo();
      } catch (err) {
        console.error("Failed to load models", err);
        setCaptureStatus('Error loading models. Ensure files are in public/models');
      }
    };
    loadModels();
  }, []);

  // 2. Start Webcam
  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error(err);
        setCaptureStatus('Camera access denied. Please allow permissions.');
      });
  };

  // 3. Check if face is inside the overlay region
  const isFaceAligned = (result, videoWidth, videoHeight) => {
    // Safety check
    if (!result || !result.detection) return false;

    // CORRECTED LINE: Access 'result.detection.box'
    const { x, y, width, height } = result.detection.box;
    
    // Define the overlay area (approximate based on CSS)
    const guideWidth = 220;
    const guideHeight = 280;
    
    const faceCenterX = x + width / 2;
    const faceCenterY = y + height / 2;
    const guideCenterX = videoWidth / 2;
    const guideCenterY = videoHeight / 2;

    const xDiff = Math.abs(faceCenterX - guideCenterX);
    const yDiff = Math.abs(faceCenterY - guideCenterY);

    // Logic: Face must be centered (within 50px tolerance) and large enough
    const isCentered = xDiff < 50 && yDiff < 50;
    const isCloseEnough = width > 100; 

    return isCentered && isCloseEnough;
  };

  // 4. Main Loop
  const handleVideoOnPlay = () => {
    setCaptureStatus('Please align your face in the oval...');
    
    const interval = setInterval(async () => {
      if (!videoRef.current || isProcessing) return;

      // Ensure video dimensions are available
      const displaySize = { 
        width: videoRef.current.videoWidth, 
        height: videoRef.current.videoHeight 
      };

      // Detect face
      const detections = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        const aligned = isFaceAligned(detections, displaySize.width, displaySize.height);
        
        if (aligned) {
            if (detections.detection.score > 0.90) { // Confidence Threshold
                clearInterval(interval);
                setIsProcessing(true);
                setCaptureStatus('Perfect! Capturing...');
                handleEnrollment(detections.descriptor);
            } else {
                setCaptureStatus('Hold steady...');
            }
        } else {
            setCaptureStatus('Center your face in the oval');
        }
      } else {
        setCaptureStatus('No face detected');
      }
    }, 500);

    return () => clearInterval(interval);
  };

  const handleEnrollment = async (descriptor) => {
    try {
      const descriptorArray = Array.from(descriptor);
      
      // 1. Call API
      await enrollFace(descriptorArray);
      
      setCaptureStatus('Registration Complete! Updating profile...');

      // 2. FIX: Update Local Storage so Dashboard knows we are enrolled
      // (We assume your AuthProvider stores data in 'user' or 'userInfo' key)
      const storedUser = localStorage.getItem('userInfo') 
        ? JSON.parse(localStorage.getItem('userInfo')) 
        : null;

      if (storedUser) {
        storedUser.isFaceEnrolled = true;
        localStorage.setItem('userInfo', JSON.stringify(storedUser));
      }

      // 3. Force Reload/Redirect to refresh the Dashboard state
      setTimeout(() => {
        // Using window.location.href forces a reload, ensuring the new state is picked up
        window.location.href = '/student-dashboard'; 
      }, 1500);

    } catch (err) {
      console.error(err);
      setCaptureStatus('Error: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-container enrollment-page">
      <h2>Face Enrollment</h2>
      <p className={`status-text ${isProcessing ? 'success' : ''}`}>{captureStatus}</p>
      
      <div className="camera-wrapper">
        <div className="face-overlay"></div>
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          onPlay={handleVideoOnPlay}
        />
      </div>
    </div>
  );
};

export default FaceEnrollment;