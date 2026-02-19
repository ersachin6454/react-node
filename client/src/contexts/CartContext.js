import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const GUEST_CART_KEY = 'guest_cart';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const { user, isAuthenticated } = useAuth();

  // Load guest cart from localStorage
  const loadGuestCart = useCallback(() => {
    try {
      const guestCart = localStorage.getItem(GUEST_CART_KEY);
      if (guestCart) {
        const items = JSON.parse(guestCart);
        setCartItems(items);
        setCartCount(items.reduce((total, item) => total + (item.quantity || 1), 0));
      } else {
        setCartItems([]);
        setCartCount(0);
      }
    } catch (error) {
      console.error('Error loading guest cart:', error);
      setCartItems([]);
      setCartCount(0);
    }
  }, []);

  // Save guest cart to localStorage
  const saveGuestCart = useCallback((items) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
      setCartItems(items);
      setCartCount(items.reduce((total, item) => total + (item.quantity || 1), 0));
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  }, []);

  const fetchCartItems = useCallback(async (force = false) => {
    if (!user?.id) return;

    // Prevent multiple simultaneous fetches
    if (isFetching && !force) {
      console.log('Already fetching cart items, skipping...');
      return;
    }

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

  // Merge guest cart with user cart when user logs in
  const mergeGuestCartWithUserCart = useCallback(async () => {
    try {
      const guestCart = localStorage.getItem(GUEST_CART_KEY);
      if (guestCart && user?.id) {
        const guestItems = JSON.parse(guestCart);
        if (guestItems.length > 0) {
          // Add each guest cart item to user's cart
          for (const item of guestItems) {
            try {
              await fetch(`/api/users/${user.id}/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  productId: item.product_id,
                  quantity: item.quantity || 1
                }),
              });
            } catch (error) {
              console.error('Error merging cart item:', error);
            }
          }
          // Clear guest cart after merging
          localStorage.removeItem(GUEST_CART_KEY);
        }
      }
    } catch (error) {
      console.error('Error merging guest cart:', error);
    }
  }, [user?.id]);

  // Track if we've already merged guest cart for this user
  const hasMergedRef = useRef(false);
  const lastUserIdRef = useRef(null);

  // Fetch cart items when user changes (only once per user)
  useEffect(() => {
    // Reset merge flag when user changes
    if (lastUserIdRef.current !== user?.id) {
      hasMergedRef.current = false;
      lastUserIdRef.current = user?.id;
    }

    if (isAuthenticated() && user?.id) {
      // Merge guest cart with user cart when user logs in (only once)
      if (!hasMergedRef.current) {
        hasMergedRef.current = true;
        mergeGuestCartWithUserCart().then(() => {
          fetchCartItems(true);
        });
      } else {
        // Just fetch cart items if already merged
        fetchCartItems(true);
      }
    } else {
      // Load guest cart for non-authenticated users
      loadGuestCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addToCart = async (productId, quantity = 1) => {
    console.log('Adding to cart:', { productId, quantity, userId: user?.id });

    // If user is not logged in, use guest cart (localStorage)
    if (!user?.id || !isAuthenticated()) {
      try {
        const currentGuestCart = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
        const productIdNum = parseInt(productId);
        const quantityNum = parseInt(quantity);

        // Check if product already exists in cart
        const existingItemIndex = currentGuestCart.findIndex(
          item => parseInt(item.product_id) === productIdNum
        );

        let updatedCart;
        if (existingItemIndex !== -1) {
          // Update quantity
          updatedCart = [...currentGuestCart];
          updatedCart[existingItemIndex].quantity = (updatedCart[existingItemIndex].quantity || 1) + quantityNum;
        } else {
          // Add new item
          updatedCart = [...currentGuestCart, { product_id: productIdNum, quantity: quantityNum }];
        }

        saveGuestCart(updatedCart);
        return true;
      } catch (error) {
        console.error('Error adding to guest cart:', error);
        return false;
      }
    }

    // If user is logged in, use server cart
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
        return false;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    // If user is not logged in, update guest cart
    if (!user?.id || !isAuthenticated()) {
      try {
        const currentGuestCart = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
        const productIdNum = parseInt(productId);
        const quantityNum = parseInt(quantity);

        if (quantityNum <= 0) {
          // Remove item if quantity is 0 or less
          const updatedCart = currentGuestCart.filter(
            item => parseInt(item.product_id) !== productIdNum
          );
          saveGuestCart(updatedCart);
        } else {
          // Update quantity
          const updatedCart = currentGuestCart.map(item =>
            parseInt(item.product_id) === productIdNum
              ? { ...item, quantity: quantityNum }
              : item
          );
          saveGuestCart(updatedCart);
        }
        return true;
      } catch (error) {
        console.error('Error updating guest cart:', error);
        return false;
      }
    }

    // If user is logged in, update server cart
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
    // If user is not logged in, remove from guest cart
    if (!user?.id || !isAuthenticated()) {
      try {
        const currentGuestCart = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
        const productIdNum = parseInt(productId);
        const updatedCart = currentGuestCart.filter(
          item => parseInt(item.product_id) !== productIdNum
        );
        saveGuestCart(updatedCart);
        return true;
      } catch (error) {
        console.error('Error removing from guest cart:', error);
        return false;
      }
    }

    // If user is logged in, remove from server cart
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
    // If user is not logged in, clear guest cart
    if (!user?.id || !isAuthenticated()) {
      try {
        localStorage.removeItem(GUEST_CART_KEY);
        setCartItems([]);
        setCartCount(0);
        return true;
      } catch (error) {
        console.error('Error clearing guest cart:', error);
        return false;
      }
    }

    // If user is logged in, clear server cart
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
