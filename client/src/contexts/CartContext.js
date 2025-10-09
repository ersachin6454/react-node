import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const { user, isAuthenticated } = useAuth();

  // Fetch cart items when user changes
  useEffect(() => {
    if (isAuthenticated() && user?.id) {
      fetchCartItems();
    } else {
      setCartItems([]);
      setCartCount(0);
    }
  }, [user?.id, isAuthenticated]);

  const fetchCartItems = useCallback(async (force = false) => {
    if (!user?.id || isFetching) return;
    
    // Debounce: Don't fetch if last fetch was less than 2 seconds ago (unless forced)
    const now = Date.now();
    if (!force && (now - lastFetchTime) < 2000) {
      console.log('Skipping cart fetch - too recent');
      return;
    }
    
    try {
      setIsFetching(true);
      setLoading(true);
      setLastFetchTime(now);
      console.log('Fetching cart items for user:', user.id);
      const response = await fetch(`/api/users/${user.id}/cart`);
      console.log('Cart fetch response:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Cart data received:', data);
        const items = data.cartItems || [];
        console.log('Cart items:', items);
        setCartItems(items);
        setCartCount(items.reduce((total, item) => total + item.quantity, 0));
      } else {
        console.error('Failed to fetch cart items:', response.status);
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [user?.id, isFetching, lastFetchTime]);

  const addToCart = async (productId, quantity = 1) => {
    console.log('Adding to cart:', { productId, quantity, userId: user?.id });
    
    if (!user?.id) {
      alert('Please login to add items to cart');
      return false;
    }

    try {
      const response = await fetch(`/api/users/${user.id}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity }),
      });

      console.log('Add to cart response:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Add to cart result:', result);
        await fetchCartItems(true); // Force fetch after adding item
        return true;
      } else {
        const error = await response.json();
        console.error('Add to cart error:', error);
        alert(error.error || 'Failed to add item to cart');
        return false;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart');
      return false;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!user?.id) return false;

    try {
      const response = await fetch(`/api/users/${user.id}/cart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (response.ok) {
        await fetchCartItems(true); // Force fetch after update
        return true;
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
    return false;
  };

  const removeFromCart = async (productId) => {
    if (!user?.id) return false;

    try {
      const response = await fetch(`/api/users/${user.id}/cart`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        await fetchCartItems(true); // Force fetch after removal
        return true;
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
    return false;
  };

  const clearCart = async () => {
    if (!user?.id) return false;

    try {
      const response = await fetch(`/api/users/${user.id}/cart`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCartItems([]);
        setCartCount(0);
        return true;
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
    return false;
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.sell_price * item.quantity);
    }, 0);
  };

  const value = {
    cartItems,
    cartCount,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    fetchCartItems
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
