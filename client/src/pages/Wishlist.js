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
    const authStatus = isAuthenticated();
    if (authStatus && user?.id) {
      fetchWishlistItems();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchWishlistItems = async () => {
    try {
      setLoading(true);
      console.log('Fetching wishlist for user:', user.id);
      const response = await fetch(`/api/users/${user.id}/wishlist`);
      console.log('Wishlist response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Wishlist data received:', data);

        // Handle different response formats
        let wishlistArray = [];
        if (data.wishlist) {
          wishlistArray = Array.isArray(data.wishlist) ? data.wishlist : [];
        } else if (Array.isArray(data)) {
          wishlistArray = data;
        }

        console.log('Wishlist array:', wishlistArray);
        console.log('Wishlist array type:', typeof wishlistArray);
        console.log('Wishlist array length:', wishlistArray.length);

        setWishlistItems(wishlistArray);

        // Fetch product details for each wishlist item
        if (wishlistArray && wishlistArray.length > 0) {
          console.log('Fetching product details for wishlist items:', wishlistArray);

          // Convert all IDs to numbers and remove duplicates/invalid values
          const uniqueWishlist = [...new Set(
            wishlistArray
              .map(id => {
                // Handle both string and number IDs, and also handle if id is an object
                if (typeof id === 'object' && id !== null) {
                  id = id.id || id.product_id || id.productId;
                }
                const numId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
                return !isNaN(numId) && numId > 0 ? numId : null;
              })
              .filter(id => id !== null)
          )];

          console.log('Unique wishlist IDs after processing:', uniqueWishlist);

          if (uniqueWishlist.length === 0) {
            console.warn('No valid product IDs found in wishlist');
            setProducts([]);
            setLoading(false);
            return;
          }

          const productPromises = uniqueWishlist.map(async (productId) => {
            try {
              const res = await fetch(`/api/products/${productId}`);
              if (res.ok) {
                const product = await res.json();
                return product;
              } else {
                console.error(`Failed to fetch product ${productId}:`, res.status);
                return null;
              }
            } catch (error) {
              console.error(`Error fetching product ${productId}:`, error);
              return null;
            }
          });

          const productDetails = await Promise.all(productPromises);
          // Filter out null values (failed fetches)
          const validProducts = productDetails.filter(p => p !== null && p.id);
          console.log('Product details fetched:', validProducts);
          console.log('Valid products count:', validProducts.length);
          setProducts(validProducts);

          // Update wishlistItems to match valid products
          if (validProducts.length !== uniqueWishlist.length) {
            console.warn(`Some products could not be loaded. Expected ${uniqueWishlist.length}, got ${validProducts.length}`);
            console.log('Failed product IDs:', uniqueWishlist.filter(id => !validProducts.find(p => p.id === id)));
          }
        } else {
          console.log('No wishlist items found - array is empty or undefined');
          setProducts([]);
        }
      } else {
        console.error('Failed to fetch wishlist, status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error data:', errorData);
        showNotification('Failed to load wishlist', 'error');
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

      {!loading && products.length === 0 && wishlistItems.length === 0 ? (
        <div className="empty-wishlist">
          <h2>Your wishlist is empty</h2>
          <p>Add some products to your wishlist!</p>
        </div>
      ) : !loading && products.length === 0 && wishlistItems.length > 0 ? (
        <div className="empty-wishlist">
          <h2>Error loading wishlist items</h2>
          <p>Some products may have been removed. Please refresh the page.</p>
          <button onClick={fetchWishlistItems} className="refresh-btn">Refresh</button>
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
