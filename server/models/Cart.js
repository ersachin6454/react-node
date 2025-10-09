const { pool } = require('../config/database');

class Cart {
  // Add item to cart
  async addItem(userId, productId, quantity = 1) {
    try {
      // Check if item already exists in cart
      const [existingItem] = await pool.execute(
        'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
        [userId, productId]
      );

      if (existingItem.length > 0) {
        // Update quantity
        await pool.execute(
          'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
          [quantity, userId, productId]
        );
      } else {
        // Add new item
        await pool.execute(
          'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
          [userId, productId, quantity]
        );
      }

      return true;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  }

  // Get user's cart with product details
  async getUserCart(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          c.id as cart_id,
          c.quantity,
          c.created_at as added_at,
          p.id as product_id,
          p.name,
          p.sell_price,
          p.price,
          p.images,
          p.quantity as stock_quantity
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
      `, [userId]);

      return rows;
    } catch (error) {
      console.error('Error fetching user cart:', error);
      throw error;
    }
  }

  // Update cart item quantity
  async updateQuantity(userId, productId, quantity) {
    try {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        await this.removeItem(userId, productId);
        return true;
      }

      await pool.execute(
        'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
        [quantity, userId, productId]
      );

      return true;
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      throw error;
    }
  }

  // Remove item from cart
  async removeItem(userId, productId) {
    try {
      await pool.execute(
        'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
        [userId, productId]
      );

      return true;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  }

  // Clear user's cart
  async clearCart(userId) {
    try {
      await pool.execute(
        'DELETE FROM cart WHERE user_id = ?',
        [userId]
      );

      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  // Get cart count
  async getCartCount(userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT SUM(quantity) as count FROM cart WHERE user_id = ?',
        [userId]
      );

      return rows[0].count || 0;
    } catch (error) {
      console.error('Error getting cart count:', error);
      throw error;
    }
  }
}

module.exports = Cart;
