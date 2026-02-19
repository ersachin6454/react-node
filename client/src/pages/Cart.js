import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const { cartItems, loading, removeFromCart, updateQuantity, fetchCartItems } = useCart();

  const fetchProductDetails = useCallback(async () => {
    if (cartItems.length === 0) {
      setProducts([]);
      return;
    }

    try {
      // Get unique product IDs to avoid duplicate fetches
      const productIds = [...new Set(cartItems.map(item => item.product_id))];
      const productPromises = productIds.map(productId =>
        fetch(`/api/products/${productId}`).then(res => res.json())
      );
      const productDetails = await Promise.all(productPromises);
      setProducts(productDetails);
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  }, [cartItems]);

  // Track if we've fetched cart items for this user
  const hasFetchedRef = useRef(false);
  const lastCartItemsLengthRef = useRef(0);

  useEffect(() => {
    // Only fetch cart items once when user logs in or page loads
    if (isAuthenticated() && user?.id && fetchCartItems && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchCartItems(true);
    }
    // Reset fetch flag when user changes
    if (!user?.id) {
      hasFetchedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    // Only fetch product details when cart items actually change (not just on every render)
    const currentLength = cartItems.length;
    if (currentLength !== lastCartItemsLengthRef.current || currentLength > 0) {
      lastCartItemsLengthRef.current = currentLength;
      fetchProductDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.length]);

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


  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showNotification('Your cart is empty', 'error');
      return;
    }

    if (!user?.id || !isAuthenticated()) {
      // Redirect to login with return path to checkout
      showNotification('Please login to proceed with checkout', 'info');
      setTimeout(() => {
        navigate('/login', { state: { returnTo: '/checkout' } });
      }, 1500);
      return;
    }

    // Navigate to checkout page
    navigate('/checkout');
  };

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
        {!isAuthenticated() && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '15px',
            color: '#856404'
          }}>
            <strong>Guest Cart:</strong> You're shopping as a guest.
            <button
              onClick={() => navigate('/login', { state: { returnTo: '/cart' } })}
              style={{
                marginLeft: '10px',
                padding: '6px 12px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
            {' '}to save your cart and checkout.
          </div>
        )}
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
            {(() => {
              // Calculate total from products array (works for both guest and logged-in users)
              const total = cartItems.reduce((sum, item) => {
                const product = getProductById(item.product_id);
                if (product) {
                  return sum + (product.sell_price * (item.quantity || 1));
                }
                return sum;
              }, 0);

              return (
                <>
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping:</span>
                    <span>Free</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </>
              );
            })()}

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

            <button className="checkout-btn" onClick={handleCheckout}>
              {!isAuthenticated() ? 'Login to Checkout' : 'Proceed to Checkout'}
            </button>
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
