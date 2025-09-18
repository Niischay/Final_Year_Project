import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createQrSession, endQrSession } from '../api/qrService'; // Import endQrSession
import QrCodeDisplay from '../components/teacher/QrCodeDisplay';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../App.css'; 

const TeacherDashboard = () => {
  const [className, setClassName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [periodNumber, setPeriodNumber] = useState('');
  
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // === Add this new state ===
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [endSessionLoading, setEndSessionLoading] = useState(false);
  // =========================

  const handleCreateSession = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setQrData(null);
    setIsSessionActive(false); // Reset on new creation

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const teacherLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        try {
          const data = {
            className,
            subjectName,
            periodNumber: parseInt(periodNumber),
            teacherLocation,
          };

          const result = await createQrSession(data);
          setQrData(result); // { sessionId, qrImage }
          setIsSessionActive(true); // === Set session to active ===
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(`Geolocation error: ${err.message}`);
        setLoading(false);
      }
    );
  };

  // === Add this new handler ===
  const handleEndSession = async () => {
    if (!qrData) return;

    setEndSessionLoading(true);
    setError('');
    try {
      await endQrSession(qrData.sessionId);
      setIsSessionActive(false); // Mark session as inactive
    } catch (err) {
      setError(err.message);
    } finally {
      setEndSessionLoading(false);
    }
  };
  // ============================

  return (
    <div className="page-container">
      <h2>Teacher Dashboard</h2>
      
      {/* Show form only if no session is active */}
      {!isSessionActive && (
        <>
          <p>Create a new attendance session.</p>
          <form onSubmit={handleCreateSession} className="login-form">
            <div className="form-group">
              <label>Class Name</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Subject Name</label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Period Number</label>
              <input
                type="number"
                value={periodNumber}
                onChange={(e) => setPeriodNumber(e.target.value)}
                required
                min="1"
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Getting Location...' : 'Create Session'}
            </button>
            {error && <p className="error-message" style={{ marginTop: '1rem' }}>{error}</p>}
          </form>
        </>
      )}


      {/* QR Code Display Area */}
      {loading && !error && <LoadingSpinner />}
      
      {qrData && (
        <>
          {/* Pass the isActive prop */}
          <QrCodeDisplay 
            qrImage={qrData.qrImage} 
            sessionId={qrData.sessionId} 
            isActive={isSessionActive} 
          />
          
          {/* Show "End Session" button only if active */}
          {isSessionActive && (
            <button 
              onClick={handleEndSession} 
              disabled={endSessionLoading}
              className="end-session-button"
            >
              {endSessionLoading ? 'Ending...' : 'End Session Manually'}
            </button>
          )}

          {/* Always show "View Flagged List" link once session is created */}
          <Link to={`/flagged/${qrData.sessionId}`} className="export-button" style={{marginTop: '1rem'}}>
            View Flagged List
          </Link>
        </>
      )}
    </div>
  );
};

export default TeacherDashboard;