const Cart = require('../models/Cart');

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const cart = new Cart();
    await cart.addItem(userId, productId, quantity);

    res.json({ message: 'Item added to cart successfully' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
};

// Get user's cart
const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = new Cart();
    const cartItems = await cart.getUserCart(userId);

    res.json({ cartItems });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 0) {
      return res.status(400).json({ error: 'Quantity cannot be negative' });
    }

    const cart = new Cart();
    await cart.updateQuantity(userId, productId, quantity);

    res.json({ message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const cart = new Cart();
    await cart.removeItem(userId, productId);

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = new Cart();
    await cart.clearCart(userId);

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};

// Get cart count
const getCartCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = new Cart();
    const count = await cart.getCartCount(userId);

    res.json({ count });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({ error: 'Failed to get cart count' });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount
};
