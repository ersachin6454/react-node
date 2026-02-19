import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaArrowLeft } from 'react-icons/fa';
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
  const [selectedWeight, setSelectedWeight] = useState('400 gram');
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) {
        throw new Error('Product not found');
      }
      const data = await response.json();

      // Ensure variant_prices is parsed if it's a string
      if (data.variant_prices && typeof data.variant_prices === 'string') {
        try {
          data.variant_prices = JSON.parse(data.variant_prices);
        } catch (e) {
          console.error('Error parsing variant_prices:', e);
          data.variant_prices = null;
        }
      }

      setProduct(data);
      setSelectedWeight(data.weight_variant || '400 gram');
    } catch (err) {
      setError(err.message);
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

  const handleAddToCart = async () => {
    if (!product) return;

    const success = await addToCart(product.id, 1);
    if (success) {
      showNotification('Item added to cart successfully!', 'success');
      navigate('/cart');
    } else {
      showNotification('Failed to add item to cart', 'error');
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    const success = await addToCart(product.id, 1);
    if (success) {
      navigate('/checkout');
    } else {
      showNotification('Failed to add item to cart', 'error');
    }
  };

  // Calculate prices using useMemo (must be before early returns)
  const currentPrice = useMemo(() => {
    if (!product) return 0;
    let variantPrices = product.variant_prices;
    if (variantPrices && typeof variantPrices === 'string') {
      try {
        variantPrices = JSON.parse(variantPrices);
      } catch (e) {
        variantPrices = null;
      }
    }
    if (variantPrices && variantPrices[selectedWeight]) {
      const variantPrice = variantPrices[selectedWeight];
      return parseFloat(variantPrice.sell_price) || parseFloat(product.sell_price) || parseFloat(product.price) || 0;
    }
    return parseFloat(product.sell_price) || parseFloat(product.price) || 0;
  }, [product, selectedWeight]);

  const originalPrice = useMemo(() => {
    if (!product) return 0;
    let variantPrices = product.variant_prices;
    if (variantPrices && typeof variantPrices === 'string') {
      try {
        variantPrices = JSON.parse(variantPrices);
      } catch (e) {
        variantPrices = null;
      }
    }
    if (variantPrices && variantPrices[selectedWeight]) {
      const variantPrice = variantPrices[selectedWeight];
      return parseFloat(variantPrice.price) || parseFloat(product.price) || 0;
    }
    return parseFloat(product.price) || 0;
  }, [product, selectedWeight]);

  const hasDiscount = useMemo(() => originalPrice > currentPrice, [originalPrice, currentPrice]);

  const variants = ['400 gram', '800 gram', '1.2kg'];

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
        {/* Product Images Gallery */}
        <div className="product-image-section">
          <div className="product-main-image-container">
            <img
              src={product.images && product.images.length > 0 ? product.images[selectedImage] : 'https://via.placeholder.com/500x400?text=No+Image'}
              alt={product.name}
              className="product-main-image"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/500x400?text=No+Image';
              }}
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="product-image-thumbnails">
              {product.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className={`thumbnail-image ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
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

          {/* Variant Selection - Box Style */}
          <div className="variant-selection-section">
            <label className="variant-section-label">Select Weight Variant:</label>
            <div className="variant-boxes">
              {variants.map((variant) => (
                <div
                  key={variant}
                  className={`variant-box ${selectedWeight === variant ? 'selected' : ''}`}
                  onClick={() => setSelectedWeight(variant)}
                >
                  <div className="variant-label">{variant}</div>
                  {(() => {
                    let variantPrices = product.variant_prices;
                    if (variantPrices && typeof variantPrices === 'string') {
                      try {
                        variantPrices = JSON.parse(variantPrices);
                      } catch (e) {
                        variantPrices = null;
                      }
                    }
                    return variantPrices && variantPrices[variant] ? (
                      <div className="variant-price-preview">
                        ${variantPrices[variant].sell_price || 'N/A'}
                      </div>
                    ) : null;
                  })()}
                </div>
              ))}
            </div>
          </div>

          {/* Price Display */}
          <div className="product-price-section">
            {hasDiscount && (
              <div className="discount-badge">
                ↓{Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}%
              </div>
            )}
            <div className="product-price">
              {hasDiscount && (
                <span className="original-price">${originalPrice.toFixed(2)}</span>
              )}
              <span className="current-price">${currentPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Small Description */}
          <div className="product-description-short">
            <p>{product.description ? (product.description.length > 150 ? product.description.substring(0, 150) + '...' : product.description) : 'High quality product with excellent features and modern design.'}</p>
          </div>

          {/* Stock Info */}
          <div className="product-stock">
            <span className="stock-label">Stock: {product.quantity || 0} available</span>
          </div>

          {/* Fixed Bottom Buttons - One Row */}
          <div className="fixed-bottom-buttons">
            <button
              className="go-to-cart-btn"
              onClick={handleAddToCart}
              disabled={!product.quantity || product.quantity <= 0}
            >
              Go to cart
            </button>
            <button
              className="buy-now-btn"
              onClick={handleBuyNow}
              disabled={!product.quantity || product.quantity <= 0}
            >
              Buy at ${currentPrice.toFixed(2)}
            </button>
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
