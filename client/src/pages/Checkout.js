import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import Notification from '../components/Notification';
import '../styles/Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const [notification, setNotification] = useState({ message: '', type: 'info', isVisible: false });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  
  // Billing information state
  const [billingInfo, setBillingInfo] = useState({
    addressLine1: '',
    addressLine2: '',
    company: '',
    city: '',
    country: '',
    state: '',
    zipCode: '',
    taxId: ''
  });

  // Card information state
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  // Save preferences state
  const [savePreferences, setSavePreferences] = useState(true);

  const fetchProductDetails = useCallback(async () => {
    try {
      setLoading(true);
      const productPromises = cartItems.map(item => 
        fetch(`/api/products/${item.product_id}`).then(res => res.json())
      );
      const productDetails = await Promise.all(productPromises);
      setProducts(productDetails);
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  }, [cartItems]);

  const loadUserPreferences = useCallback(async () => {
    try {
      console.log('Loading preferences for user:', user.id);
      const response = await fetch(`/api/users/${user.id}/preferences`);
      console.log('Preferences response status:', response.status);
      
      if (response.ok) {
        const preferences = await response.json();
        console.log('Loaded preferences:', preferences);
        
        // Load saved address if available
        if (preferences.savedAddress) {
          console.log('Loading saved address:', preferences.savedAddress);
          setBillingInfo(preferences.savedAddress);
        } else {
          console.log('No saved address found');
        }
        
        // Load saved payment info if available
        if (preferences.savedPaymentInfo) {
          console.log('Loading saved payment info:', preferences.savedPaymentInfo);
          setPaymentMethod(preferences.savedPaymentInfo.paymentMethod || 'credit-card');
          if (preferences.savedPaymentInfo.cardInfo) {
            setCardInfo(preferences.savedPaymentInfo.cardInfo);
          }
        } else {
          console.log('No saved payment info found');
        }
      } else {
        console.log('Failed to load preferences, status:', response.status);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/products');
      return;
    }
    
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    fetchProductDetails();
    loadUserPreferences();
  }, [cartItems, isAuthenticated, navigate, fetchProductDetails, loadUserPreferences]);

  const saveUserPreferences = async () => {
    try {
      const preferences = {
        savedAddress: billingInfo,
        savedPaymentInfo: {
          paymentMethod,
          cardInfo: paymentMethod === 'credit-card' ? cardInfo : null
        }
      };

      await fetch(`/api/users/${user.id}/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, isVisible: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = ['addressLine1', 'city', 'country', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => !billingInfo[field].trim());
    
    if (missingFields.length > 0) {
      showNotification('Please fill in all required billing fields', 'error');
      return false;
    }

    if (paymentMethod === 'credit-card') {
      const cardFields = ['cardNumber', 'expiryDate', 'cvv', 'cardholderName'];
      const missingCardFields = cardFields.filter(field => !cardInfo[field].trim());
      
      if (missingCardFields.length > 0) {
        showNotification('Please fill in all required card information', 'error');
        return false;
      }
    }

    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Save user preferences before processing order (if user wants to save)
      if (savePreferences) {
        await saveUserPreferences();
      }
      
      // Create payment intent with Stripe
      const paymentResponse = await fetch(`/api/payment/${user.id}/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shippingAddress: billingInfo,
          billingAddress: billingInfo
        }),
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        showNotification(error.error || 'Failed to create payment intent', 'error');
        return;
      }

      const { clientSecret } = await paymentResponse.json();

      // For demo purposes, we'll simulate payment confirmation
      // In production, you would use Stripe Elements to collect payment method
      // and confirm the payment intent on the frontend
      
      // Extract payment intent ID from client secret
      const paymentIntentId = clientSecret.split('_secret_')[0];
      
      // Process payment and create order
      const confirmResponse = await fetch(`/api/payment/${user.id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntentId,
          shippingAddress: billingInfo,
          billingAddress: billingInfo
        }),
      });

      if (confirmResponse.ok) {
        const result = await confirmResponse.json();
        
        // Clear cart after successful order
        await clearCart();
        
        // Redirect to thank you page with order data
        navigate('/thank-you', {
          state: {
            orderData: {
              orderId: result.orderId,
              transactionId: result.transactionId,
              amount: result.amount,
              currency: result.currency,
              paymentStatus: result.paymentStatus,
              shippingAddress: billingInfo
            }
          }
        });
      } else {
        const error = await confirmResponse.json();
        showNotification(error.error || 'Payment failed', 'error');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      showNotification('Failed to process payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getProductById = (productId) => {
    return products.find(p => p.id === productId);
  };

  if (loading) {
    return (
      <div className="checkout-container">
        <div className="loading">Loading checkout...</div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <button onClick={() => navigate('/cart')} className="back-btn">
          ← Back
        </button>
        <h1>Checkout</h1>
      </div>

      <div className="checkout-content">
        <div className="checkout-left">
          {/* Payment Method Section */}
          <div className="payment-section">
            <h2>Payment method</h2>
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="credit-card"
                  checked={paymentMethod === 'credit-card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="radio-label">Credit card</span>
                <div className="card-logos">
                  <span className="card-logo visa">VISA</span>
                  <span className="card-logo mastercard">Mastercard</span>
                  <span className="card-logo amex">AMEX</span>
                  <span className="card-logo discover">Discover</span>
                </div>
              </label>
            </div>

            {paymentMethod === 'credit-card' && (
              <div className="card-form">
                <button className="add-card-btn">Add new card</button>
                <div className="card-fields">
                  <div className="form-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={cardInfo.cardNumber}
                      onChange={handleCardChange}
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={cardInfo.expiryDate}
                        onChange={handleCardChange}
                        placeholder="MM/YY"
                      />
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={cardInfo.cvv}
                        onChange={handleCardChange}
                        placeholder="123"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      name="cardholderName"
                      value={cardInfo.cardholderName}
                      onChange={handleCardChange}
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Billing Information Section */}
          <div className="billing-section">
            <h2>Billing Information</h2>
            <div className="billing-form">
              <div className="form-group">
                <label>Address Line 1 *</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={billingInfo.addressLine1}
                  onChange={handleBillingChange}
                  placeholder="Address Line 1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={billingInfo.addressLine2}
                  onChange={handleBillingChange}
                  placeholder="Address Line 2"
                />
              </div>
              
              <div className="form-group">
                <label>Company (optional)</label>
                <input
                  type="text"
                  name="company"
                  value={billingInfo.company}
                  onChange={handleBillingChange}
                  placeholder="e.g.: Monsters Inc."
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={billingInfo.city}
                    onChange={handleBillingChange}
                    placeholder="Your city"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Country *</label>
                  <select
                    name="country"
                    value={billingInfo.country}
                    onChange={handleBillingChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>State *</label>
                  <select
                    name="state"
                    value={billingInfo.state}
                    onChange={handleBillingChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="CA">California</option>
                    <option value="NY">New York</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ZIP Code *</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={billingInfo.zipCode}
                    onChange={handleBillingChange}
                    placeholder="Your ZIP code"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Tax ID (optional)</label>
                <div className="tax-id-group">
                  <select>
                    <option value="">Select</option>
                    <option value="EIN">EIN</option>
                    <option value="SSN">SSN</option>
                  </select>
                  <input
                    type="text"
                    name="taxId"
                    value={billingInfo.taxId}
                    onChange={handleBillingChange}
                    placeholder="Your tax id"
                  />
                </div>
              </div>
              
              <button className="add-billing-btn">Add</button>
            </div>
          </div>
        </div>

        <div className="checkout-right">
          {/* Payment Summary */}
          <div className="payment-summary">
            <h2>Payment summary</h2>
            
            <div className="order-items">
              {cartItems.map((item, index) => {
                const product = getProductById(item.product_id);
                if (!product) return null;
                
                return (
                  <div key={index} className="order-item">
                    <div className="item-info">
                      <h4>{product.name}</h4>
                      <p>Quantity: {item.quantity}</p>
                    </div>
                    <div className="item-price">
                      ${(product.sell_price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="discount-section">
              <details>
                <summary>Have a discount code?</summary>
                <div className="discount-form">
                  <input type="text" placeholder="Enter discount code" />
                  <button>Apply</button>
                </div>
              </details>
            </div>
            
            <div className="total-section">
              <div className="total-row">
                <span>Total</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
            
            <div className="billing-info">
              <p>You'll be charged ${getTotalPrice().toFixed(2)} today.</p>
            </div>
            
            <div className="save-preferences-section">
              <label className="save-preferences-checkbox">
                <input
                  type="checkbox"
                  checked={savePreferences}
                  onChange={(e) => setSavePreferences(e.target.checked)}
                />
                <span>Save address and payment info for next time</span>
              </label>
            </div>
            
            <button 
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Complete Order'}
            </button>
            
            <div className="security-badges">
              <div className="security-badge">Norton SECURED</div>
              <div className="security-badge">digicert SECURED</div>
            </div>
          </div>
        </div>
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
}

export default Checkout;
