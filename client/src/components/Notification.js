import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import '../styles/Notification.css';

function Notification({ message, type = 'info', isVisible, onClose }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="notification-icon success" />;
      case 'error':
        return <FaExclamationCircle className="notification-icon error" />;
      default:
        return <FaInfoCircle className="notification-icon info" />;
    }
  };

  return (
    <div className={`notification ${type} ${isVisible ? 'show' : ''}`}>
      <div className="notification-content">
        {getIcon()}
        <span className="notification-message">{message}</span>
        <button className="notification-close" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
    </div>
  );
}

export default Notification;
