import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
// Import the new function
import { getFlaggedAttendance, approveFlaggedAttendance } from '../api/attendanceService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './FlaggedPage.css';

const FlaggedPage = () => {
  const { sessionId } = useParams();
  const [flaggedRecords, setFlaggedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New state to show messages (e.g., "Student approved")
  const [message, setMessage] = useState('');

  const API_BASE_URL = 'http://localhost:5000/api';
  const exportUrl = `${API_BASE_URL}/attendance/export/${sessionId}`;

  // Fetch data on load
  useEffect(() => {
    const fetchFlagged = async () => {
      try {
        setLoading(true);
        const data = await getFlaggedAttendance(sessionId);
        setFlaggedRecords(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFlagged();
  }, [sessionId]);

  // === Add this new handler ===
  const handleApprove = async (attendanceId) => {
    setMessage('');
    setError('');

    try {
      // Call the API
      await approveFlaggedAttendance(attendanceId);
      setMessage('Student approved successfully.');

      // Remove the student from the list in the UI
      setFlaggedRecords(prevRecords => 
        prevRecords.filter(record => record._id !== attendanceId)
      );
      
    } catch (err) {
      setError(err.message);
    }
  };
  // ============================

  return (
    <div className="page-container">
      <h2>Teacher's Final Verification</h2>
      <p>Review students who were flagged for being out of range. You can manually approve them here.</p>
      <p className="session-id-display">Session ID: {sessionId}</p>

      {/* Export Button - now part of Step 3 */}
      <a href={exportUrl} className="export-button" download>
        Export Final List to Excel
      </a>

      {loading && <LoadingSpinner />}
      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}
      
      {!loading && !error && (
        <table className="flagged-table">
          <thead>
            <tr>
              <th>Register Number</th>
              <th>Flagged At</th>
              <th>Action</th> {/* Add new column */}
            </tr>
          </thead>
          <tbody>
            {flaggedRecords.length > 0 ? (
              flaggedRecords.map((record) => (
                <tr key={record._id}>
                  <td>{record.user.registerNumber}</td>
                  <td>{new Date(record.createdAt).toLocaleTimeString()}</td>
                  <td>
                    {/* Add the "Approve" button */}
                    <button 
                      className="approve-button"
                      onClick={() => handleApprove(record._id)}
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No students are currently flagged for this session.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FlaggedPage;