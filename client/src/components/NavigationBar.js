import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUser, FaShoppingCart, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import ProfileModal from './ProfileModal';
import Notification from './Notification';
import '../styles/Navigation.css';

function NavigationBar() {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'info', isVisible: false });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();

  const handleProfileClick = (e) => {
    e.preventDefault();
    if (isAuthenticated()) {
      // If logged in, show user menu or redirect to profile
      console.log('User is logged in:', user);
    } else {
      // If not logged in, show login modal
      setIsModalOpen(true);
    }
  };

  // Cart count is now managed by CartContext

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, isVisible: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const handleLogout = () => {
    logout();
    showNotification('Logged out successfully!', 'success');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Show navigation even while loading

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Prevent body scroll when menu is open
    if (!isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand" onClick={closeMobileMenu}>
          <img src="/assets/image/logo.png" alt="logo" className="logo" />
        </Link>
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className={isMobileMenuOpen ? 'hamburger open' : 'hamburger'}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link
            to="/products"
            className={location.pathname === '/products' ? 'nav-link active' : 'nav-link'}
            onClick={closeMobileMenu}
          >
            <FaUser className="nav-icon" />
            <span>Products</span>
          </Link>
          <Link
            to="/cart"
            className={location.pathname === '/cart' ? 'nav-link active' : 'nav-link'}
            onClick={closeMobileMenu}
          >
            <div className="cart-icon-container">
              <FaShoppingCart className="nav-icon" />
              {cartCount > 0 && (
                <span className="cart-count">{cartCount}</span>
              )}
            </div>
            <span>Cart</span>
          </Link>
          {isAuthenticated() ? (
            <>
              <Link
                to="/profile"
                className={location.pathname === '/profile' ? 'nav-link active' : 'nav-link'}
                onClick={closeMobileMenu}
              >
                <FaUserCircle className="nav-icon" />
                <span>Profile</span>
              </Link>
              <button
                className="nav-link"
                onClick={() => {
                  handleLogout();
                  closeMobileMenu();
                }}
              >
                <FaSignOutAlt className="nav-icon" />
                <span>Logout</span>
              </button>
              {user?.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className="nav-link admin-link"
                  onClick={closeMobileMenu}
                >
                  <span>Admin</span>
                </Link>
              )}
            </>
          ) : (
            <button
              className="nav-link"
              onClick={() => {
                handleProfileClick();
                closeMobileMenu();
              }}
            >
              <FaUser className="nav-icon" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
      <ProfileModal isOpen={isModalOpen} onClose={handleCloseModal} />
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </nav>
  );
}

export default NavigationBar;
