import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaStar } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import Notification from '../components/Notification';
import '../styles/Products.css';

function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: 'info', isVisible: false });
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();

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

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, isVisible: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = async (product, event) => {
    event.stopPropagation(); // Prevent navigation when clicking add to cart
    console.log('handleAddToCart called with product:', product);
    const success = await addToCart(product.id, 1);
    console.log('Add to cart success:', success);
    if (success) {
      showNotification('Item added to cart successfully!', 'success');
      // Don't navigate to cart page - just add to cart
    } else {
      showNotification('Failed to add item to cart', 'error');
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
          <div key={product.id || index} className="product-card" onClick={() => handleProductClick(product.id)}>
            <div className="product-image">
              <img
                src={product.images && product.images.length > 0 ? product.images[0] : `https://images.unsplash.com/photo-${1500000000000 + index}?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80`}
                alt={product.name || 'Product'}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                }}
              />
              <div className="product-actions-overlay">
                <button
                  className="product-cart-btn"
                  onClick={(e) => handleAddToCart(product, e)}
                  title="Add to Cart"
                >
                  <FaShoppingCart />
                </button>
              </div>
            </div>

            <div className="product-info">
              <h3 className="products-page-title">
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
                onClick={(e) => handleAddToCart(product, e)}
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
