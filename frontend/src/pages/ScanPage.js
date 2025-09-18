import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { markAttendance } from '../api/attendanceService';
import WebcamScanner from '../components/student/WebcamScanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './ScanPage.css'; // We'll create this

const ScanPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [scanSuccessful, setScanSuccessful] = useState(false);

  const navigate = useNavigate();

  // This function is called by WebcamScanner on a successful scan
  const handleScanSuccess = (decodedText) => {
    if (loading || scanSuccessful) return; // Prevent multiple scans

    setLoading(true);
    setMessage('QR code scanned. Getting your location...');
    setIsError(false);
    setScanSuccessful(true); // Lock scanning

    let sessionId;
    try {
      // Your QR code contains JSON
      const qrData = JSON.parse(decodedText);
      sessionId = qrData.sessionId;
      if (!sessionId) throw new Error("Invalid QR code data.");
    } catch (e) {
      setMessage('Invalid QR code. Please scan the correct one.');
      setIsError(true);
      setLoading(false);
      setScanSuccessful(false); // Allow re-scan
      return;
    }

    // 1. Get Student's Location
    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by your browser');
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

        // 2. Call the API to mark attendance
        try {
          setMessage('Location captured. Marking attendance...');
          const data = { sessionId, location };
          const result = await markAttendance(data);

          // Success or Flagged
          setMessage(result.message);
          setIsError(false);
        } catch (err) {
          setMessage(err.message);
          setIsError(true);
        } finally {
          setLoading(false);
          // Redirect back to dashboard after 3 seconds
          setTimeout(() => navigate('/student-dashboard'), 3000);
        }
      },
      (err) => {
        // Geolocation error
        setMessage(`Geolocation error: ${err.message}. Please enable location.`);
        setIsError(true);
        setLoading(false);
        setScanSuccessful(false); // Allow re-scan
      }
    );
  };

  const handleScanFailure = (errorMessage) => {
    // This can be noisy (e.g., "QR code not found")
    // We'll just log it for now
    console.warn(errorMessage);
  };

  return (
    <div className="page-container scan-page">
      <h2>Scan Attendance QR Code</h2>
      
      {!loading && !scanSuccessful && (
        <p>Point your camera at the QR code presented by the teacher.</p>
      )}

      {/* Message Area */}
      {message && (
        <div className={`message-box ${isError ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Loading Spinner */}
      {loading && <LoadingSpinner />}

      {/* The Scanner */}
      {!scanSuccessful && !loading && (
        <WebcamScanner
          onScanSuccess={handleScanSuccess}
          onScanFailure={handleScanFailure}
        />
      )}
    </div>
  );
};

export default ScanPage;