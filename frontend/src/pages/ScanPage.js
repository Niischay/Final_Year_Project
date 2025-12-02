import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { markAttendance } from '../api/attendanceService';
import WebcamScanner from '../components/student/WebcamScanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './ScanPage.css';

const ScanPage = () => {
  // Steps: 'qr' -> 'face' -> 'submitting'
  const [step, setStep] = useState('qr'); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const videoRef = useRef(null);
  const navigate = useNavigate();

  // 1. Load Face Models on Mount
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load models", err);
        setMessage("Error loading AI models.");
        setIsError(true);
      }
    };
    loadModels();
  }, []);

  // 2. Handle QR Scan Success
  const handleQrSuccess = (decodedText) => {
    if (step !== 'qr') return;

    try {
      const qrData = JSON.parse(decodedText);
      if (!qrData.sessionId) throw new Error("Invalid QR data");
      
      setSessionId(qrData.sessionId);
      setStep('face'); // Move to Face Verification Step
      setMessage("QR Scanned! Please look at the camera for verification.");
    } catch (e) {
      setMessage('Invalid QR Code. Try again.');
      setIsError(true);
    }
  };

  const handleQrFailure = (err) => {
    console.warn(err);
  };

  // 3. Handle Face Detection (Runs when step === 'face')
  useEffect(() => {
    if (step === 'face' && modelsLoaded) {
      startVideo();
    }
    // eslint-disable-next-line
  }, [step, modelsLoaded]);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error(err);
        setMessage("Camera access denied.");
        setIsError(true);
      });
  };

  // Constant loop to check for face
  const handleVideoPlay = () => {
    const interval = setInterval(async () => {
      if (step !== 'face' || !videoRef.current) {
        clearInterval(interval);
        return;
      }

      try {
        const detection = await faceapi.detectSingleFace(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          clearInterval(interval);
          
          // Stop video stream
          const stream = videoRef.current.srcObject;
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());

          // Proceed to submission
          handleAttendanceSubmission(detection.descriptor);
        }
      } catch (err) {
        console.error("Face detection error:", err);
      }
    }, 1000); // Check every second
  };

  // 4. Submit to Backend
  const handleAttendanceSubmission = async (faceDescriptor) => {
    setStep('submitting');
    setLoading(true);
    setMessage('Verifying Face & Location...');

    if (!navigator.geolocation) {
      setMessage('Geolocation not supported.');
      setIsError(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        try {
          // Convert Float32Array to regular Array for JSON
          const descriptorArray = Array.from(faceDescriptor);

          const result = await markAttendance({
            sessionId,
            location,
            faceDescriptor: descriptorArray
          });

          setMessage(result.message);
          setIsError(false);
        } catch (err) {
          setMessage(err.message || "Attendance failed");
          setIsError(true);
        } finally {
          setLoading(false);
          setTimeout(() => navigate('/student-dashboard'), 3000);
        }
      },
      (err) => {
        setMessage("Location permission denied.");
        setIsError(true);
        setLoading(false);
      }
    );
  };

  return (
    <div className="page-container scan-page">
      <h2>Scan & Verify</h2>
      
      {/* Messages */}
      {message && (
        <div className={`message-box ${isError ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {loading && <LoadingSpinner />}

      {/* Step 1: QR Scanner */}
      {step === 'qr' && !loading && (
        <div className="scanner-container">
           <p className="instruction-text">Step 1: Scan the Teacher's QR Code</p>
           {modelsLoaded ? (
             <WebcamScanner 
               onScanSuccess={handleQrSuccess} 
               onScanFailure={handleQrFailure} 
             />
           ) : (
             <p>Loading Camera Models...</p>
           )}
        </div>
      )}

      {/* Step 2: Face Verification */}
      {step === 'face' && (
        <div className="face-verify-container">
          <p className="instruction-text">Step 2: verifying Identity...</p>
          <div className="video-wrapper">
             <video 
               ref={videoRef} 
               autoPlay 
               muted 
               onPlay={handleVideoPlay}
               width="320" 
               height="240"
               style={{ borderRadius: '10px', border: '2px solid #2ecc71' }}
             />
          </div>
          <p>Please hold still...</p>
        </div>
      )}
    </div>
  );
};

export default ScanPage;