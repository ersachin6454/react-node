const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if admin exists
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND role = "admin"',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token with 1 hour expiration for admin
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Create admin user (for initial setup)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if admin already exists
    const [existingAdmin] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND role = "admin"',
      [email]
    );

    if (existingAdmin.length > 0) {
      return res.status(400).json({ error: 'Admin with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "admin")',
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: result.insertId,
        name,
        email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Server error during admin creation' });
  }
};

// Get admin profile
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin.id;

    const [rows] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ? AND role = "admin"',
      [adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ error: 'Server error fetching admin profile' });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
};

// Create new user (admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const [existingUser] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, confirm_password, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, hashedPassword, role]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: result.insertId,
        name,
        email,
        role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error creating user' });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (user or admin)' });
    }

    // Check if user exists
    const [existingUser] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user role
    await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Server error updating user role' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [existingUser] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deletion of admin users
    if (existingUser[0].role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin users' });
    }

    // Delete user
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
};

// Get all cart items across all users
const getAllCartItems = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.cart_item,
        u.created_at as user_created_at
      FROM users u
      WHERE u.cart_item IS NOT NULL 
        AND u.cart_item != '[]'
        AND u.cart_item != 'null'
        AND u.cart_item != ''
        AND u.role = 'user'
      ORDER BY u.created_at DESC
    `);

    console.log(`Found ${rows.length} users with cart items`);

    // Parse cart items and get product details
    const cartItemsWithDetails = [];
    for (const user of rows) {
      try {
        let cartItems = [];

        // Handle different cart_item formats
        if (user.cart_item === null || user.cart_item === undefined) {
          continue;
        }

        if (typeof user.cart_item === 'string') {
          // Try to parse JSON string
          try {
            const parsed = JSON.parse(user.cart_item);
            cartItems = Array.isArray(parsed) ? parsed : [];
          } catch (parseError) {
            console.error(`Error parsing cart_item JSON for user ${user.user_id}:`, parseError);
            console.error(`Raw cart_item value:`, user.cart_item);
            continue;
          }
        } else if (Array.isArray(user.cart_item)) {
          cartItems = user.cart_item;
        } else if (typeof user.cart_item === 'object') {
          // If it's an object, try to convert to array
          cartItems = [user.cart_item];
        }

        if (Array.isArray(cartItems) && cartItems.length > 0) {
          for (const item of cartItems) {
            // Handle different item structures
            const productId = item.product_id || item.productId || item.id;
            const quantity = item.quantity || 1;

            if (!productId) {
              console.error(`Invalid cart item structure for user ${user.user_id}:`, item);
              continue;
            }

            const [productRows] = await pool.execute(
              'SELECT id, name, sell_price, price, images FROM products WHERE id = ?',
              [productId]
            );

            if (productRows.length > 0) {
              cartItemsWithDetails.push({
                user_id: user.user_id,
                user_name: user.user_name,
                user_email: user.user_email,
                product_id: productRows[0].id,
                product_name: productRows[0].name,
                product_price: productRows[0].sell_price,
                product_images: productRows[0].images,
                quantity: parseInt(quantity) || 1,
                added_at: user.user_created_at
              });
            } else {
              console.error(`Product not found for ID: ${productId}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error parsing cart for user ${user.user_id}:`, error);
        console.error(`User email: ${user.user_email}, Cart item:`, user.cart_item);
      }
    }

    res.json(cartItemsWithDetails);
  } catch (error) {
    console.error('Get all cart items error:', error);
    res.status(500).json({ error: 'Server error fetching cart items' });
  }
};

// Get all wishlist items across all users
const getAllWishlistItems = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.wishlist,
        u.created_at as user_created_at
      FROM users u
      WHERE u.wishlist IS NOT NULL 
        AND u.wishlist != '[]'
        AND u.wishlist != 'null'
        AND u.role = 'user'
      ORDER BY u.created_at DESC
    `);

    // Parse wishlist items and get product details
    const wishlistItemsWithDetails = [];
    for (const user of rows) {
      try {
        let wishlist = [];
        if (typeof user.wishlist === 'string') {
          wishlist = JSON.parse(user.wishlist);
        } else {
          wishlist = user.wishlist || [];
        }

        if (Array.isArray(wishlist) && wishlist.length > 0) {
          // Remove duplicates
          const uniqueWishlist = [...new Set(wishlist)];

          for (const productId of uniqueWishlist) {
            const [productRows] = await pool.execute(
              'SELECT id, name, sell_price, price, images FROM products WHERE id = ?',
              [productId]
            );

            if (productRows.length > 0) {
              wishlistItemsWithDetails.push({
                user_id: user.user_id,
                user_name: user.user_name,
                user_email: user.user_email,
                product_id: productRows[0].id,
                product_name: productRows[0].name,
                product_price: productRows[0].sell_price,
                product_images: productRows[0].images,
                added_at: user.user_created_at
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error parsing wishlist for user ${user.user_id}:`, error);
      }
    }

    res.json(wishlistItemsWithDetails);
  } catch (error) {
    console.error('Get all wishlist items error:', error);
    res.status(500).json({ error: 'Server error fetching wishlist items' });
  }
};

module.exports = {
  adminLogin,
  createAdmin,
  getAdminProfile,
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getAllCartItems,
  getAllWishlistItems
};
