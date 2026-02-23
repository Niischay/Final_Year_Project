import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { markAttendance } from '../api/attendanceService';
import WebcamScanner from '../components/student/WebcamScanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './ScanPage.css';

const ScanPage = () => {
  // Steps: 'qr' -> 'location' (hidden step) -> 'face' -> 'submitting'
  const [step, setStep] = useState('qr'); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [locationCoords, setLocationCoords] = useState(null);

  const videoRef = useRef(null);
  const navigate = useNavigate();
  
  // FIX: Ref to prevent double-firing of QR success
  // This persists across renders and updates immediately
  const processingRef = useRef(false);

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

  // 2. Handle QR Scan Success -> THEN Get Location
  const handleQrSuccess = (decodedText) => {
    // FIX: Check if we are already processing a scan
    if (step !== 'qr' || processingRef.current) return;

    try {
      const qrData = JSON.parse(decodedText);
      if (!qrData.sessionId) throw new Error("Invalid QR data");
      
      // LOCK: Prevent further scans immediately
      processingRef.current = true;

      setSessionId(qrData.sessionId);
      
      // Stop QR scanner UI
      setLoading(true); 
      setMessage("QR Scanned! Fetching Location...");
      setIsError(false);

      // Immediately fetch location
      fetchLocation();

    } catch (e) {
      setMessage('Invalid QR Code. Try again.');
      setIsError(true);
      setLoading(false);
      // Reset lock on failure so they can try again
      processingRef.current = false;
    }
  };

  const handleQrFailure = (err) => {
    // console.warn(err); 
  };

  // 2.5 Fetch Location Helper
  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation not supported by this browser.');
      setIsError(true);
      setLoading(false);
      return;
    }

    setMessage("Acquiring Location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocationCoords(coords);
        
        setMessage("Location Verified! Switching to Face Camera...");

        // Delay to allow QR camera to fully release before Face camera starts
        setTimeout(() => {
          setLoading(false);
          setStep('face'); 
        }, 2000); 
      },
      (err) => {
        console.error(err);
        setMessage("Location permission denied. Cannot proceed.");
        setIsError(true);
        setLoading(false);
        // Do NOT reset processingRef here, force reload/reset manually if needed
      }
    );
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
          
          const stream = videoRef.current.srcObject;
          if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
          }

          handleAttendanceSubmission(detection.descriptor);
        }
      } catch (err) {
        console.error("Face detection error:", err);
      }
    }, 1000);
  };

  // 4. Submit to Backend
  const handleAttendanceSubmission = async (faceDescriptor) => {
    setStep('submitting');
    setLoading(true);
    setMessage('Verifying Identity...');

    if (!locationCoords) {
      setMessage("Error: Location not found. Please rescan.");
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      const descriptorArray = Array.from(faceDescriptor);

      const result = await markAttendance({
        sessionId,
        location: locationCoords,
        faceDescriptor: descriptorArray
      });

      setMessage(result.message || "Attendance Marked Successfully!");
      setIsError(false);
      
      setTimeout(() => navigate('/student-dashboard'), 3000);

    } catch (err) {
      setMessage(err.message || "Attendance failed");
      setIsError(true);
      setLoading(false);
    }
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
      {step === 'face' && !loading && (
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