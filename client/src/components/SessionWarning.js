import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/SessionWarning.css';

function SessionWarning() {
  const { sessionWarning, timeRemaining, extendSession, formatTime, logout } = useAuth();

  if (!sessionWarning) {
    return null;
  }

  const handleExtendSession = () => {
    extendSession();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="session-warning-overlay">
      <div className="session-warning-modal">
        <div className="session-warning-header">
          <h3>⚠️ Session Expiring Soon</h3>
        </div>
        
        <div className="session-warning-content">
          <p>Your session will expire in:</p>
          <div className="time-display">
            {formatTime(timeRemaining)}
          </div>
          <p className="warning-text">
            You will be automatically logged out for security reasons.
          </p>
        </div>
        
        <div className="session-warning-actions">
          <button 
            onClick={handleLogout}
            className="logout-btn"
          >
            Logout Now
          </button>
          <button 
            onClick={handleExtendSession}
            className="extend-btn"
          >
            Extend Session
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionWarning;
