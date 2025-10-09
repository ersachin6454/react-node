import React from 'react';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>About Us</h3>
            <p>React Node.js Full Stack Application</p>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/register">Register</a></li>
              <li><a href="/profile">Profile</a></li>
              <li><a href="/wishlist">Wishlist</a></li>
              <li><a href="/cart">Cart</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <p>Email: info@example.com</p>
            <p>Phone: (123) 456-7890</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 React Node.js App. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
