import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaHeart, FaStar } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import Notification from '../components/Notification';
import '../styles/Products.css';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: 'info', isVisible: false });
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isAuthenticated() && user?.id) {
      fetchWishlistItems();
    }
  }, [user?.id]);

  const fetchWishlistItems = async () => {
    if (wishlistLoading) return; // Prevent multiple simultaneous calls
    
    try {
      setWishlistLoading(true);
      const response = await fetch(`/api/users/${user.id}/wishlist`);
      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data.wishlist || []);
      }
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
    } finally {
      setWishlistLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, isVisible: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const isInWishlist = (productId) => {
    return wishlistItems.includes(parseInt(productId));
  };

  const addToCart = async (product) => {
    if (!isAuthenticated()) {
      showNotification('Please login to add items to cart!', 'error');
      return;
    }

    try {
      console.log('Adding to cart:', { productId: product.id, userId: user.id });
      const response = await fetch(`/api/users/${user.id}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Cart updated:', result);
        showNotification('Item added to cart successfully!', 'success');
        // Optionally refresh cart count in navigation
      } else {
        const error = await response.json();
        console.error('Cart error:', error);
        showNotification(error.error || 'Failed to add to cart', 'error');
      }
    } catch (error) {
      console.error('Cart fetch error:', error);
      showNotification('Failed to add to cart. Please try again.', 'error');
    }
  };

  const toggleWishlist = async (product) => {
    if (!isAuthenticated()) {
      showNotification('Please login to manage your wishlist!', 'error');
      return;
    }

    if (wishlistLoading) {
      return; // Prevent multiple simultaneous calls
    }

    const isInWishlistItem = isInWishlist(product.id);
    const method = isInWishlistItem ? 'DELETE' : 'POST';
    const action = isInWishlistItem ? 'remove from' : 'add to';

    try {
      const response = await fetch(`/api/users/${user.id}/wishlist`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id })
      });

      if (response.ok) {
        const result = await response.json();
        showNotification(`Item ${action} wishlist successfully!`, 'success');
        // Use the wishlist data returned from the API
        if (result.wishlist && Array.isArray(result.wishlist)) {
          setWishlistItems(result.wishlist);
        }
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || `Failed to ${action} wishlist`, 'error');
      }
    } catch (error) {
      showNotification('Network error. Please check your connection and try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="products-container">
        <div className="loading">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="products-container">
      <div className="products-header">
        <h1>Our Products</h1>
        <p>Discover amazing products just for you</p>
      </div>

      <div className="products-grid">
        {products.map((product, index) => (
          <div key={product.id || index} className="product-card">
            <div className="product-image">
              <img 
                src={product.images && product.images.length > 0 ? product.images[0] : `https://images.unsplash.com/photo-${1500000000000 + index}?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80`} 
                alt={product.name || 'Product'}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                }}
              />
              <div className="product-actions">
                <button 
                  className={`action-btn wishlist-btn ${isInWishlist(product.id) ? 'in-wishlist' : ''}`}
                  onClick={() => toggleWishlist(product)}
                  title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <FaHeart />
                </button>
                <button 
                  className="action-btn cart-btn"
                  onClick={() => addToCart(product)}
                  title="Add to Cart"
                >
                  <FaShoppingCart />
                </button>
              </div>
            </div>
            
            <div className="product-info">
              <h3 className="product-title">
                {product.name || `Product ${index + 1}`}
              </h3>
              
              <div className="product-rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar 
                    key={i} 
                    className={`star ${i < 4 ? 'filled' : ''}`} 
                  />
                ))}
                <span className="rating-text">(4.0)</span>
              </div>
              
              <div className="product-price">
                <span className="price">${product.sell_price || product.price}</span>
                {product.price > product.sell_price && (
                  <span className="original-price">${product.price}</span>
                )}
              </div>
              
              <p className="product-description">
                {product.description || 'High quality product with excellent features and modern design.'}
              </p>
              
              <div className="product-quantity">
                <span className="quantity-label">Stock: {product.quantity || 0}</span>
              </div>
              
              <button 
                className="add-to-cart-btn"
                onClick={() => addToCart(product)}
                disabled={!product.quantity || product.quantity <= 0}
              >
                <FaShoppingCart />
                {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="no-products">
          <h2>No products available</h2>
          <p>Check back later for new products!</p>
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

export default Products;
