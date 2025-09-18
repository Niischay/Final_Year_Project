import React from 'react';
import './QrCodeDisplay.css'; 

// Add the 'isActive' prop
const QrCodeDisplay = ({ qrImage, sessionId, isActive }) => {
  return (
    <div className={`qr-display-container ${!isActive ? 'inactive' : ''}`}>
      
      {/* Conditionally show title */}
      {isActive ? (
        <h3>Session Active!</h3>
      ) : (
        <h3>Session Ended</h3>
      )}

      {qrImage && (
        <img 
          src={qrImage} 
          alt="Attendance QR Code" 
          className="qr-image" 
        />
      )}
      
      <p className="session-id">Session ID: {sessionId}</p>

      {/* Conditionally show warning */}
      {isActive ? (
        <p className="warning">This session will expire in 5 minutes.</p>
      ) : (
        <p className="session-ended-msg">Students can no longer mark attendance.</p>
      )}
    </div>
  );
};

export default QrCodeDisplay;