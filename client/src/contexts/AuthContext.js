import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const intervalRef = useRef(null);

  // Get session timeout based on user role
  const getSessionTimeout = (userRole) => {
    if (userRole === 'admin') {
      return 60 * 60 * 1000; // 1 hour for admin
    }
    return 8 * 60 * 60 * 1000; // 8 hours for regular users
  };

  // Get warning time (5 minutes before expiry)
  const getWarningTime = (userRole) => {
    const sessionTimeout = getSessionTimeout(userRole);
    return sessionTimeout - (5 * 60 * 1000); // 5 minutes before expiry
  };

  // Start session timer
  const startSessionTimer = (userData) => {
    const sessionTimeout = getSessionTimeout(userData.role);
    const warningTime = getWarningTime(userData.role);

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      setSessionWarning(true);
      setTimeRemaining(5 * 60); // 5 minutes in seconds
      
      // Start countdown
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningTime);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleAutoLogout();
    }, sessionTimeout);
  };

  // Handle automatic logout
  const handleAutoLogout = () => {
    setUser(null);
    setSessionWarning(false);
    setTimeRemaining(0);
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    // Clear all timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Show logout message
    alert('Your session has expired. Please log in again.');
  };

  // Extend session (reset timers)
  const extendSession = () => {
    if (user) {
      setSessionWarning(false);
      setTimeRemaining(0);
      startSessionTimer(user);
    }
  };

  // Format time remaining
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem('user');
    const adminUser = localStorage.getItem('adminUser');
    
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      startSessionTimer(userData);
    } else if (adminUser) {
      const adminData = JSON.parse(adminUser);
      setUser(adminData);
      startSessionTimer(adminData);
    }
    
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    startSessionTimer(userData);
  };

  const logout = () => {
    setUser(null);
    setSessionWarning(false);
    setTimeRemaining(0);
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    // Clear all timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isLoading,
    sessionWarning,
    timeRemaining,
    extendSession,
    formatTime
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
