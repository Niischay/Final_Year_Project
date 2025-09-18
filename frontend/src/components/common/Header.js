import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <h1>QR Attendance System</h1>
      {isAuthenticated && (
        <button onClick={handleLogout}>Logout</button>
      )}
    </header>
  );
};

export default Header;