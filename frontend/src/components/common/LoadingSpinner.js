import React from 'react';
import './LoadingSpinner.css'; // Create this file next

const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner;