import React, { useState } from 'react';
import '../styles/RegisterForm.css';

const RegisterForm = ({ onRegisterSuccess, onRegisterError }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.phone && !/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-()]/g, ''))) {
      errors.phone = 'Phone number is invalid';
    }
    
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 13) {
        errors.dateOfBirth = 'You must be at least 13 years old';
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsLoading(true);
    setValidationErrors({});
    
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || null,
          dateOfBirth: formData.dateOfBirth || null
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      await response.json();
      onRegisterSuccess();
      
    } catch (error) {
      onRegisterError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">First Name *</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className={validationErrors.firstName ? 'error' : ''}
            placeholder="Enter your first name"
            required
          />
          {validationErrors.firstName && (
            <span className="error-text">{validationErrors.firstName}</span>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="lastName">Last Name *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className={validationErrors.lastName ? 'error' : ''}
            placeholder="Enter your last name"
            required
          />
          {validationErrors.lastName && (
            <span className="error-text">{validationErrors.lastName}</span>
          )}
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email Address *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={validationErrors.email ? 'error' : ''}
          placeholder="Enter your email address"
          required
        />
        {validationErrors.email && (
          <span className="error-text">{validationErrors.email}</span>
        )}
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={validationErrors.password ? 'error' : ''}
            placeholder="Create a password"
            required
          />
          {validationErrors.password && (
            <span className="error-text">{validationErrors.password}</span>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password *</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={validationErrors.confirmPassword ? 'error' : ''}
            placeholder="Confirm your password"
            required
          />
          {validationErrors.confirmPassword && (
            <span className="error-text">{validationErrors.confirmPassword}</span>
          )}
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className={validationErrors.phone ? 'error' : ''}
            placeholder="Enter your phone number"
          />
          {validationErrors.phone && (
            <span className="error-text">{validationErrors.phone}</span>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="dateOfBirth">Date of Birth</label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            className={validationErrors.dateOfBirth ? 'error' : ''}
          />
          {validationErrors.dateOfBirth && (
            <span className="error-text">{validationErrors.dateOfBirth}</span>
          )}
        </div>
      </div>
      
      <div className="form-actions">
        <button 
          type="submit" 
          className="btn btn-primary btn-full"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
      
      <div className="form-footer">
        <p>Already have an account? <a href="/login">Sign in here</a></p>
      </div>
    </form>
  );
};

export default RegisterForm;
