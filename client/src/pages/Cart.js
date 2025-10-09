import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import Notification from '../components/Notification';
import '../styles/Cart.css';

function Cart() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ message: '', type: 'info', isVisible: false });
  const [products, setProducts] = useState([]);
  const [address, setAddress] = useState({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: ''
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { cartItems, loading, removeFromCart, updateQuantity, getTotalPrice, fetchCartItems } = useCart();

  const fetchProductDetails = useCallback(async () => {
    if (cartItems.length === 0) return;
    
    try {
      const productPromises = cartItems.map(item => 
        fetch(`/api/products/${item.product_id}`).then(res => res.json())
      );
      const productDetails = await Promise.all(productPromises);
      setProducts(productDetails);
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  }, [cartItems]);

  useEffect(() => {
    console.log('Cart useEffect triggered:', { isAuthenticated: isAuthenticated(), userId: user?.id, cartItemsLength: cartItems.length });
    if (isAuthenticated() && user?.id) {
      // Force refresh cart items when cart page loads
      fetchCartItems(true); // Force fetch on cart page load
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    console.log('Cart items changed:', cartItems.length);
    if (cartItems.length > 0) {
      fetchProductDetails();
    }
  }, [cartItems]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, isVisible: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    const success = await updateQuantity(productId, newQuantity);
    if (success) {
      showNotification('Cart updated successfully!', 'success');
    }
  };

  const removeItem = async (productId) => {
    const success = await removeFromCart(productId);
    if (success) {
      showNotification('Item removed from cart!', 'success');
    } else {
      showNotification('Failed to remove item', 'error');
    }
  };

  const getProductById = (productId) => {
    const product = products.find(p => p.id === productId);
    console.log('Getting product by ID:', productId, 'Found:', product);
    return product;
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateAddress = () => {
    const requiredFields = ['fullName', 'street', 'city', 'state', 'zipCode', 'country', 'phone'];
    const missingFields = requiredFields.filter(field => !address[field].trim());
    
    if (missingFields.length > 0) {
      showNotification('Please fill in all required address fields', 'error');
      return false;
    }
    return true;
  };

  const handleCheckout = () => {
    if (!user?.id) {
      showNotification('Please login to proceed with checkout', 'error');
      return;
    }

    if (cartItems.length === 0) {
      showNotification('Your cart is empty', 'error');
      return;
    }

    // Navigate to checkout page
    navigate('/checkout');
  };

  if (!isAuthenticated()) {
    return (
      <div className="cart-container">
        <div className="cart-header">
          <h1>Your Cart</h1>
          <p>Please login to view your cart</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cart-container">
        <div className="loading">Loading cart...</div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Your Cart</h1>
        <p>{cartItems.length} item(s) in your cart</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Add some products to get started!</p>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {cartItems.map((item, index) => {
              const product = getProductById(item.product_id);
              if (!product) return null;

              return (
                <div key={index} className="cart-item">
                  <div className="item-image">
                    <img
                      src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/100x100?text=No+Image'}
                      alt={product.name}
                    />
                  </div>
                  
                  <div className="item-details">
                    <h3 className="item-name">{product.name}</h3>
                    <p className="item-description">{product.description}</p>
                    <div className="item-price">${product.sell_price}</div>
                  </div>

                  <div className="item-quantity">
                    <label>Quantity:</label>
                    <div className="quantity-controls">
                      <button
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="item-total">
                    <div className="item-total-price">
                      ${(product.sell_price * item.quantity).toFixed(2)}
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item.product_id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>Free</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            
            <div className="address-section">
              <div className="address-header">
                <h4>Shipping Address</h4>
                <button 
                  className="toggle-address-btn"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                >
                  {showAddressForm ? 'Hide Address Form' : 'Add/Edit Address'}
                </button>
              </div>
              
              {showAddressForm && (
                <div className="address-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name *</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={address.fullName}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={address.phone}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="street">Street Address *</label>
                    <input
                      type="text"
                      id="street"
                      name="street"
                      value={address.street}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">City *</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={address.city}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="state">State/Province *</label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={address.state}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="zipCode">ZIP/Postal Code *</label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={address.zipCode}
                        onChange={handleAddressChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="country">Country *</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={address.country}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                </div>
              )}
            </div>
            
            <button className="checkout-btn" onClick={handleCheckout}>Proceed to Checkout</button>
          </div>
        </div>
      )}

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
}

export default Cart;
