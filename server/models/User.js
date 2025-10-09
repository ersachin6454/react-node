const { pool } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.confirm_password = data.confirm_password;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM users ORDER BY created_at DESC');
      return rows.map(row => new User(row));
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      if (rows.length === 0) {
        return null;
      }
      return new User(rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        return null;
      }
      return new User(rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch user by email: ${error.message}`);
    }
  }

  static async create(userData) {
    try {
      const { name, email, password, confirm_password } = userData;
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, confirm_password) VALUES (?, ?, ?, ?)',
        [name, email, password, confirm_password]
      );
      
      const newUser = await User.findById(result.insertId);
      return newUser;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  static async update(id, userData) {
    try {
      const { name, email, password, confirm_password } = userData;
      const [result] = await pool.execute(
        'UPDATE users SET name = ?, email = ?, password = ?, confirm_password = ? WHERE id = ?',
        [name, email, password, confirm_password, id]
      );
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return await User.findById(id);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Wishlist methods
  static async addToWishlist(userId, productId) {
    try {
      const productIdNum = parseInt(productId);
      console.log('Adding product to wishlist:', { userId, productId, productIdNum });

      // Use a transaction to prevent race conditions
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Get current user data with row lock to prevent concurrent modifications
        const [userRows] = await connection.execute(
          'SELECT * FROM users WHERE id = ? FOR UPDATE',
          [userId]
        );

        if (userRows.length === 0) {
          throw new Error('User not found');
        }

        const user = userRows[0];
        let wishlist = [];
        
        if (user.wishlist) {
          try {
            // Handle both JSON objects and JSON strings
            let parsedWishlist;
            if (typeof user.wishlist === 'string') {
              parsedWishlist = JSON.parse(user.wishlist);
            } else {
              parsedWishlist = user.wishlist;
            }
            wishlist = Array.isArray(parsedWishlist) ? parsedWishlist : [];
          } catch (error) {
            console.log('Error parsing wishlist, starting fresh:', error);
            wishlist = [];
          }
        }

        // Always add the product to wishlist (allow duplicates)
        wishlist.push(productIdNum);
        
        await connection.execute(
          'UPDATE users SET wishlist = ? WHERE id = ?',
          [JSON.stringify(wishlist), userId]
        );

        await connection.commit();
        return wishlist;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error in addToWishlist:', error);
      throw new Error(`Failed to add to wishlist: ${error.message}`);
    }
  }


  static async removeFromWishlist(userId, productId) {
    try {
      const productIdNum = parseInt(productId);
      console.log('Removing product from wishlist:', { userId, productId, productIdNum });

      // Use a transaction to prevent race conditions
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Get current user data with row lock to prevent concurrent modifications
        const [userRows] = await connection.execute(
          'SELECT * FROM users WHERE id = ? FOR UPDATE',
          [userId]
        );

        if (userRows.length === 0) {
          throw new Error('User not found');
        }

        const user = userRows[0];
        let wishlist = [];
        
        if (user.wishlist) {
          try {
            // Handle both JSON objects and JSON strings
            let parsedWishlist;
            if (typeof user.wishlist === 'string') {
              parsedWishlist = JSON.parse(user.wishlist);
            } else {
              parsedWishlist = user.wishlist;
            }
            wishlist = Array.isArray(parsedWishlist) ? parsedWishlist : [];
          } catch (error) {
            console.log('Error parsing wishlist, starting fresh:', error);
            wishlist = [];
          }
        }

        wishlist = wishlist.filter(id => parseInt(id) !== productIdNum);
        
        await connection.execute(
          'UPDATE users SET wishlist = ? WHERE id = ?',
          [JSON.stringify(wishlist), userId]
        );

        await connection.commit();
        return wishlist;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error in removeFromWishlist:', error);
      throw new Error(`Failed to remove from wishlist: ${error.message}`);
    }
  }

  static async getWishlist(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let wishlist = [];
      if (user.wishlist) {
        try {
          // Handle both JSON objects and JSON strings
          let parsedWishlist;
          if (typeof user.wishlist === 'string') {
            parsedWishlist = JSON.parse(user.wishlist);
          } else {
            parsedWishlist = user.wishlist;
          }
          wishlist = Array.isArray(parsedWishlist) ? parsedWishlist : [];
        } catch (error) {
          console.log('Error parsing wishlist in getWishlist:', error);
          wishlist = [];
        }
      }

      return wishlist;
    } catch (error) {
      throw new Error(`Failed to get wishlist: ${error.message}`);
    }
  }

  // Cart methods
  static async addToCart(userId, productId, quantity = 1) {
    try {
      // Convert productId to number for consistency
      const productIdNum = parseInt(productId);
      const quantityNum = parseInt(quantity);
      console.log('Adding product to cart:', { userId, productId, productIdNum, quantity: quantityNum });

      // Use a transaction to prevent race conditions
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Get current user data with row lock to prevent concurrent modifications
        const [userRows] = await connection.execute(
          'SELECT * FROM users WHERE id = ? FOR UPDATE',
          [userId]
        );

        if (userRows.length === 0) {
          throw new Error('User not found');
        }

        const user = userRows[0];
        let cartItems = [];
        
        if (user.cart_item) {
          try {
            cartItems = JSON.parse(user.cart_item);
            console.log('Current cart items:', cartItems);
          } catch (error) {
            console.log('Error parsing cart items, starting fresh:', error);
            cartItems = [];
          }
        }

        // Check if product already exists in cart (compare as numbers)
        const existingItemIndex = cartItems.findIndex(item => parseInt(item.product_id) === productIdNum);
        console.log('Existing item index:', existingItemIndex);
        
        if (existingItemIndex !== -1) {
          // Update quantity
          cartItems[existingItemIndex].quantity += quantityNum;
          console.log('Updated existing item quantity:', cartItems[existingItemIndex]);
        } else {
          // Add new item
          cartItems.push({ product_id: productIdNum, quantity: quantityNum });
          console.log('Added new item to cart:', cartItems[cartItems.length - 1]);
        }

        console.log('Final cart items:', cartItems);
        await connection.execute(
          'UPDATE users SET cart_item = ? WHERE id = ?',
          [JSON.stringify(cartItems), userId]
        );
        console.log('Cart saved to database');

        await connection.commit();
        return cartItems;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error in addToCart:', error);
      throw new Error(`Failed to add to cart: ${error.message}`);
    }
  }

  static async removeFromCart(userId, productId) {
    try {
      // Convert productId to number for consistency
      const productIdNum = parseInt(productId);
      console.log('Removing product from cart:', { userId, productId, productIdNum });

      // Use a transaction to prevent race conditions
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Get current user data with row lock to prevent concurrent modifications
        const [userRows] = await connection.execute(
          'SELECT * FROM users WHERE id = ? FOR UPDATE',
          [userId]
        );

        if (userRows.length === 0) {
          throw new Error('User not found');
        }

        const user = userRows[0];
        let cartItems = [];
        
        if (user.cart_item) {
          try {
            cartItems = JSON.parse(user.cart_item);
          } catch (error) {
            cartItems = [];
          }
        }

        // Filter out the product (compare as numbers)
        cartItems = cartItems.filter(item => parseInt(item.product_id) !== productIdNum);
        
        await connection.execute(
          'UPDATE users SET cart_item = ? WHERE id = ?',
          [JSON.stringify(cartItems), userId]
        );

        await connection.commit();
        return cartItems;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw new Error(`Failed to remove from cart: ${error.message}`);
    }
  }

  static async updateCartQuantity(userId, productId, quantity) {
    try {
      // Convert productId to number for consistency
      const productIdNum = parseInt(productId);
      const quantityNum = parseInt(quantity);
      console.log('Updating cart quantity:', { userId, productId, productIdNum, quantity: quantityNum });

      // Use a transaction to prevent race conditions
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Get current user data with row lock to prevent concurrent modifications
        const [userRows] = await connection.execute(
          'SELECT * FROM users WHERE id = ? FOR UPDATE',
          [userId]
        );

        if (userRows.length === 0) {
          throw new Error('User not found');
        }

        const user = userRows[0];
        let cartItems = [];
        
        if (user.cart_item) {
          try {
            cartItems = JSON.parse(user.cart_item);
          } catch (error) {
            cartItems = [];
          }
        }

        const itemIndex = cartItems.findIndex(item => parseInt(item.product_id) === productIdNum);
        
        if (itemIndex !== -1) {
          if (quantityNum <= 0) {
            cartItems.splice(itemIndex, 1);
          } else {
            cartItems[itemIndex].quantity = quantityNum;
          }
        }

        await connection.execute(
          'UPDATE users SET cart_item = ? WHERE id = ?',
          [JSON.stringify(cartItems), userId]
        );

        await connection.commit();
        return cartItems;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw new Error(`Failed to update cart quantity: ${error.message}`);
    }
  }

  static async getCart(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let cartItems = [];
      if (user.cart_item) {
        try {
          cartItems = JSON.parse(user.cart_item);
        } catch (error) {
          cartItems = [];
        }
      }

      return cartItems;
    } catch (error) {
      throw new Error(`Failed to get cart: ${error.message}`);
    }
  }

  static async getCartItemCount(userId) {
    try {
      const cartItems = await User.getCart(userId);
      return cartItems.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      throw new Error(`Failed to get cart item count: ${error.message}`);
    }
  }

  // Save user preferences (address and payment info)
  static async saveUserPreferences(userId, preferences) {
    try {
      const { savedAddress, savedPaymentInfo } = preferences;
      
      const updateFields = [];
      const updateValues = [];
      
      if (savedAddress) {
        updateFields.push('saved_address = ?');
        updateValues.push(JSON.stringify(savedAddress));
      }
      
      if (savedPaymentInfo) {
        updateFields.push('saved_payment_info = ?');
        updateValues.push(JSON.stringify(savedPaymentInfo));
      }
      
      if (updateFields.length === 0) {
        throw new Error('No preferences to save');
      }
      
      updateValues.push(userId);
      
      await pool.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      return true;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw new Error(`Failed to save user preferences: ${error.message}`);
    }
  }

  // Get user preferences
  static async getUserPreferences(userId) {
    try {
      console.log('Getting user preferences for user ID:', userId);
      
      const [rows] = await pool.execute(
        'SELECT saved_address, saved_payment_info FROM users WHERE id = ?',
        [userId]
      );
      
      console.log('Database query result:', rows);
      
      if (rows.length === 0) {
        console.log('User not found in database');
        // Return empty preferences instead of throwing error
        return {
          savedAddress: null,
          savedPaymentInfo: null
        };
      }
      
      const user = rows[0];
      console.log('User data from database:', user);
      
      const preferences = {
        savedAddress: user.saved_address ? JSON.parse(user.saved_address) : null,
        savedPaymentInfo: user.saved_payment_info ? JSON.parse(user.saved_payment_info) : null
      };
      
      console.log('Parsed preferences:', preferences);
      return preferences;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      // Return empty preferences instead of throwing error
      return {
        savedAddress: null,
        savedPaymentInfo: null
      };
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = User;
