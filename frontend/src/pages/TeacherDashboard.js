import React, { useState, useEffect } from 'react'; // Added useEffect
import { Link } from 'react-router-dom';
import { createQrSession, endQrSession } from '../api/qrService';
import { getAllClasses } from '../api/classService'; // Import the new service
import QrCodeDisplay from '../components/teacher/QrCodeDisplay';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../App.css'; 

const TeacherDashboard = () => {
  const [className, setClassName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [periodNumber, setPeriodNumber] = useState('');
  
  // === New State for Classes ===
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  // ============================

  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [endSessionLoading, setEndSessionLoading] = useState(false);

  // === Fetch Classes on Mount ===
  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const data = await getAllClasses();
        setClasses(data);
        // Automatically select the first class if available
        if (data.length > 0) {
          setClassName(data[0].className);
        }
      } catch (err) {
        console.error("Failed to load classes", err);
        setError('Failed to load class list. Please refresh.');
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);
  // ==============================

  const handleCreateSession = (e) => {
    e.preventDefault();
    setError('');
    
    if (!className) {
      setError('Please select a class');
      return;
    }

    setLoading(true);
    setQrData(null);
    setIsSessionActive(false); 

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
            className, // This now comes from the dropdown
            subjectName,
            periodNumber: parseInt(periodNumber),
            teacherLocation,
          };

          const result = await createQrSession(data);
          setQrData(result); 
          setIsSessionActive(true); 
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

  const handleEndSession = async () => {
    if (!qrData) return;

    setEndSessionLoading(true);
    setError('');
    try {
      await endQrSession(qrData.sessionId);
      setIsSessionActive(false); 
    } catch (err) {
      setError(err.message);
    } finally {
      setEndSessionLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h2>Teacher Dashboard</h2>
      
      {!isSessionActive && (
        <>
          <p>Create a new attendance session.</p>
          <form onSubmit={handleCreateSession} className="login-form">
            
            {/* === Updated Class Selection (MCQ/Dropdown Format) === */}
            <div className="form-group">
              <label>Class Name</label>
              {loadingClasses ? (
                <p>Loading classes...</p>
              ) : (
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                  className="form-control" // Ensure you have basic styling for select
                  style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                >
                  <option value="" disabled>Select a Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls.className}>
                      {cls.className}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {/* ===================================================== */}

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
            <button type="submit" disabled={loading || loadingClasses}>
              {loading ? 'Getting Location...' : 'Create Session'}
            </button>
            {error && <p className="error-message" style={{ marginTop: '1rem' }}>{error}</p>}
          </form>
        </>
      )}

      {loading && !error && <LoadingSpinner />}
      
      {qrData && (
        <>
          <QrCodeDisplay 
            qrImage={qrData.qrImage} 
            sessionId={qrData.sessionId} 
            isActive={isSessionActive} 
          />
          
          {isSessionActive && (
            <button 
              onClick={handleEndSession} 
              disabled={endSessionLoading}
              className="end-session-button"
            >
              {endSessionLoading ? 'Ending...' : 'End Session Manually'}
            </button>
          )}

          <Link to={`/flagged/${qrData.sessionId}`} className="export-button" style={{marginTop: '1rem'}}>
            View Flagged List
          </Link>
        </>
      )}
    </div>
  );
};

export default TeacherDashboard;