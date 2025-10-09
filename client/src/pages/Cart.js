import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Notification from '../components/Notification';
import '../styles/Cart.css';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: 'info', isVisible: false });
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated() && user?.id) {
      fetchCartItems();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated(), user?.id]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user.id}/cart`);
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.cartItems || []);
        
        // Fetch product details for each cart item
        if (data.cartItems && data.cartItems.length > 0) {
          const productPromises = data.cartItems.map(item => 
            fetch(`/api/products/${item.product_id}`).then(res => res.json())
          );
          const productDetails = await Promise.all(productPromises);
          setProducts(productDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
      showNotification('Failed to load cart items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, isVisible: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const updateQuantity = async (productId, newQuantity) => {
    try {
      const response = await fetch(`/api/users/${user.id}/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: newQuantity })
      });

      if (response.ok) {
        showNotification('Cart updated successfully!', 'success');
        fetchCartItems(); // Refresh cart
      } else {
        const error = await response.json();
        showNotification(error.error || 'Failed to update cart', 'error');
      }
    } catch (error) {
      showNotification('Failed to update cart. Please try again.', 'error');
    }
  };

  const removeItem = async (productId) => {
    try {
      const response = await fetch(`/api/users/${user.id}/cart`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });

      if (response.ok) {
        showNotification('Item removed from cart!', 'success');
        fetchCartItems(); // Refresh cart
      } else {
        const error = await response.json();
        showNotification(error.error || 'Failed to remove item', 'error');
      }
    } catch (error) {
      showNotification('Failed to remove item. Please try again.', 'error');
    }
  };

  const getProductById = (productId) => {
    return products.find(p => p.id === productId);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const product = getProductById(item.product_id);
      if (product) {
        return total + (product.sell_price * item.quantity);
      }
      return total;
    }, 0);
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
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
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
            <button className="checkout-btn">Proceed to Checkout</button>
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
