import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUser, FaHeart, FaShoppingCart, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from './ProfileModal';
import Notification from './Notification';
import '../styles/Navigation.css';

function NavigationBar() {
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [notification, setNotification] = useState({ message: '', type: 'info', isVisible: false });
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  
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

  // Fetch cart count when user is authenticated
  useEffect(() => {
    const fetchCartCount = async () => {
      if (isAuthenticated() && user?.id) {
        try {
          const response = await fetch(`/api/users/${user.id}/cart/count`);
          if (response.ok) {
            const data = await response.json();
            setCartCount(data.count || 0);
          }
        } catch (error) {
          console.error('Error fetching cart count:', error);
        }
      } else {
        setCartCount(0);
      }
    };

    fetchCartCount();
  }, [isAuthenticated(), user?.id]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, isVisible: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const handleLogout = () => {
    logout();
    setCartCount(0);
    showNotification('Logged out successfully!', 'success');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Show navigation even while loading
  
  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <img src="/assets/image/logo.png" alt="logo" className="logo" />
        </Link>
        <div className="nav-links">
          <Link 
            to="/products" 
            className={location.pathname === '/products' ? 'nav-link active' : 'nav-link'}
          >
            <FaUser className="nav-icon" />
            <span>Products</span>
          </Link>
          <Link 
            to="/wishlist" 
            className={location.pathname === '/wishlist' ? 'nav-link active' : 'nav-link'}
          >
            <FaHeart className="nav-icon" />
            <span>Wishlist</span>
          </Link>
          <Link 
            to="/cart" 
            className={location.pathname === '/cart' ? 'nav-link active' : 'nav-link'}
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
              <button 
                className="nav-link"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="nav-icon" />
                <span>Logout</span>
              </button>
              {user?.role === 'admin' && (
                <Link 
                  to="/admin/dashboard" 
                  className="nav-link admin-link"
                >
                  <span>Admin</span>
                </Link>
              )}
            </>
          ) : (
            <button 
              className="nav-link"
              onClick={handleProfileClick}
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
