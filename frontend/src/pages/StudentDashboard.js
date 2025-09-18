import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import './StudentDashboard.css'; // We'll create this

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="page-container student-dashboard">
      <h2>Welcome, {user?.registerNumber || 'Student'}!</h2>
      <p>Click the button below to scan the class QR code and mark your attendance.</p>
      
      <Link to="/scan" className="scan-button">
        Scan Attendance QR
      </Link>
    </div>
  );
};

export default StudentDashboard;