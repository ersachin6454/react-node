import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaHeart, FaStar, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import Notification from '../components/Notification';
import '../styles/SingleProduct.css';

function SingleProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: 'info', isVisible: false });
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
    if (isAuthenticated() && user?.id) {
      fetchWishlistItems();
    }
  }, [id, user?.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) {
        throw new Error('Product not found');
      }
      const data = await response.json();
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlistItems = async () => {
    if (!user?.id) return;
    
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

  const handleAddToCart = async () => {
    if (!product) return;
    
    const success = await addToCart(product.id, quantity);
    if (success) {
      showNotification('Item added to cart successfully!', 'success');
      // Navigate to cart page after successful add to cart
      setTimeout(() => {
        navigate('/cart');
      }, 1000); // Small delay to show the success message
    } else {
      showNotification('Failed to add item to cart', 'error');
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated()) {
      showNotification('Please login to manage your wishlist!', 'error');
      return;
    }

    if (wishlistLoading || !product) {
      return;
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

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= (product?.quantity || 0)) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div className="single-product-container">
        <div className="loading">Loading product...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="single-product-container">
        <div className="error">
          <h2>Product not found</h2>
          <p>The product you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/products')} className="back-btn">
            <FaArrowLeft /> Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="single-product-container">
      <button onClick={() => navigate('/products')} className="back-btn">
        <FaArrowLeft /> Back to Products
      </button>

      <div className="product-details">
        <div className="product-image-section">
          <img 
            src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/500x400?text=No+Image'} 
            alt={product.name}
            className="product-main-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/500x400?text=No+Image';
            }}
          />
        </div>

        <div className="product-info-section">
          <h1 className="single-product-title">{product.name}</h1>
          
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
            <span className="current-price">${product.sell_price || product.price}</span>
            {product.price > product.sell_price && (
              <span className="original-price">${product.price}</span>
            )}
          </div>

          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description || 'High quality product with excellent features and modern design.'}</p>
          </div>

          <div className="product-stock">
            <span className="stock-label">Stock: {product.quantity || 0}</span>
          </div>

          <div className="product-actions">
            <div className="quantity-selector">
              <label htmlFor="quantity">Quantity:</label>
              <div className="quantity-controls">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  min="1"
                  max={product.quantity || 0}
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= (product.quantity || 0)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="action-buttons">
              <button 
                className={`wishlist-btn ${isInWishlist(product.id) ? 'in-wishlist' : ''}`}
                onClick={toggleWishlist}
                disabled={wishlistLoading}
              >
                <FaHeart />
                {isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>

              <button 
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={!product.quantity || product.quantity <= 0}
              >
                <FaShoppingCart />
                {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
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

export default SingleProduct;
