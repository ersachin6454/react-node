import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Notification from '../components/Notification';
import '../styles/Wishlist.css';

function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: 'info', isVisible: false });
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated() && user?.id) {
      fetchWishlistItems();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated(), user?.id]);

  const fetchWishlistItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user.id}/wishlist`);
      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data.wishlist || []);
        
        // Fetch product details for each wishlist item
        if (data.wishlist && data.wishlist.length > 0) {
          const productPromises = data.wishlist.map(productId => 
            fetch(`/api/products/${productId}`).then(res => res.json())
          );
          const productDetails = await Promise.all(productPromises);
          setProducts(productDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
      showNotification('Failed to load wishlist items', 'error');
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

  const removeFromWishlist = async (productId) => {
    try {
      const response = await fetch(`/api/users/${user.id}/wishlist`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });

      if (response.ok) {
        showNotification('Item removed from wishlist!', 'success');
        fetchWishlistItems(); // Refresh wishlist
      } else {
        const error = await response.json();
        showNotification(error.error || 'Failed to remove item', 'error');
      }
    } catch (error) {
      showNotification('Failed to remove item. Please try again.', 'error');
    }
  };

  const addToCart = async (product) => {
    try {
      const response = await fetch(`/api/users/${user.id}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 })
      });

      if (response.ok) {
        showNotification('Item added to cart successfully!', 'success');
      } else {
        const error = await response.json();
        showNotification(error.error || 'Failed to add to cart', 'error');
      }
    } catch (error) {
      showNotification('Failed to add to cart. Please try again.', 'error');
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-header">
          <h1>Your Wishlist</h1>
          <p>Please login to view your wishlist</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="wishlist-container">
        <div className="loading">Loading wishlist...</div>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h1>Your Wishlist</h1>
        <p>{wishlistItems.length} item(s) in your wishlist</p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="empty-wishlist">
          <h2>Your wishlist is empty</h2>
          <p>Add some products to your wishlist!</p>
        </div>
      ) : (
        <div className="wishlist-items">
          {products.map((product, index) => (
            <div key={product.id || index} className="wishlist-item">
              <div className="item-image">
                <img
                  src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/200x200?text=No+Image'}
                  alt={product.name}
                />
              </div>
              
              <div className="item-details">
                <h3 className="item-name">{product.name}</h3>
                <p className="item-description">{product.description}</p>
                <div className="item-price">${product.sell_price}</div>
              </div>

              <div className="item-actions">
                <button
                  className="add-to-cart-btn"
                  onClick={() => addToCart(product)}
                >
                  Add to Cart
                </button>
                <button
                  className="remove-btn"
                  onClick={() => removeFromWishlist(product.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
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

export default Wishlist;
