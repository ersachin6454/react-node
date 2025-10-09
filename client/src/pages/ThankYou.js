import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ThankYou.css';

const ThankYou = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/products');
      return;
    }

    // Get order data from location state
    if (location.state?.orderData) {
      setOrderData(location.state.orderData);
      setLoading(false);
    } else {
      // If no order data, redirect to products
      navigate('/products');
    }
  }, [isAuthenticated, navigate, location.state]);

  if (loading) {
    return (
      <div className="thank-you-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="thank-you-container">
        <div className="error">No order data found</div>
      </div>
    );
  }

  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  return (
    <div className="thank-you-container">
      <div className="thank-you-content">
        <div className="success-icon">✅</div>
        <h1>Thank You for Your Order!</h1>
        <p className="success-message">
          Your payment has been processed successfully and your order is being prepared.
        </p>

        <div className="order-details">
          <h2>Order Details</h2>
          <div className="detail-row">
            <span className="label">Order ID:</span>
            <span className="value">#{orderData.orderId}</span>
          </div>
          <div className="detail-row">
            <span className="label">Transaction ID:</span>
            <span className="value">{orderData.transactionId}</span>
          </div>
          <div className="detail-row">
            <span className="label">Amount:</span>
            <span className="value">{formatAmount(orderData.amount, orderData.currency)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Payment Status:</span>
            <span className="value status-success">{orderData.paymentStatus}</span>
          </div>
          <div className="detail-row">
            <span className="label">Date:</span>
            <span className="value">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="shipping-info">
          <h3>Shipping Information</h3>
          {orderData.shippingAddress && (
            <div className="address-details">
              <p><strong>Name:</strong> {orderData.shippingAddress.name}</p>
              <p><strong>Address:</strong> {orderData.shippingAddress.addressLine1}</p>
              {orderData.shippingAddress.addressLine2 && (
                <p>{orderData.shippingAddress.addressLine2}</p>
              )}
              <p>
                {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.zipCode}
              </p>
              <p><strong>Country:</strong> {orderData.shippingAddress.country}</p>
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/products')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
