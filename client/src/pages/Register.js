import React, { useState } from 'react';
import RegisterForm from '../components/RegisterForm';
import '../styles/Register.css';

const Register = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState(null);

  const handleRegisterSuccess = () => {
    setIsRegistered(true);
    setError(null);
  };

  const handleRegisterError = (errorMessage) => {
    setError(errorMessage);
    setIsRegistered(false);
  };

  if (isRegistered) {
    return (
      <div className="register-page">
        <div className="register-container">
          <div className="success-message">
            <h2>Registration Successful!</h2>
            <p>Your account has been created successfully.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setIsRegistered(false)}
            >
              Register Another User
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Create Account</h1>
          <p>Join our platform and start your journey</p>
        </div>
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <RegisterForm 
          onRegisterSuccess={handleRegisterSuccess}
          onRegisterError={handleRegisterError}
        />
      </div>
    </div>
  );
};

export default Register;
