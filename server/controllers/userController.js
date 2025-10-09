const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, confirm_password } = req.body;
    
    // Basic validation
    if (!name || !email || !password || !confirm_password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    const user = await User.create({ name, email, password, confirm_password });
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    const user = await User.create({ 
      name: username, 
      email, 
      password, 
      confirm_password: password 
    });
    
    res.status(201).json({ 
      message: 'User registered successfully', 
      user: { id: user.id, username: user.name, email: user.email } 
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Simple password check (in production, use bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ 
      message: 'Login successful', 
      user: { id: user.id, username: user.name, email: user.email } 
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to login user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, confirm_password } = req.body;
    
    // Basic validation
    if (!name || !email || !password || !confirm_password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if email is being changed and if new email already exists
    if (email !== existingUser.email) {
      const emailExists = await User.findByEmail(email);
      if (emailExists) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
    }
    
    const user = await User.update(id, { name, email, password, confirm_password });
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const deleted = await User.delete(id);
    if (deleted) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Wishlist operations
const addToWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if product exists
    const product = new Product();
    const productExists = await product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const wishlist = await User.addToWishlist(userId, productId);
    res.json({ message: 'Added to wishlist successfully', wishlist });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to add to wishlist' });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const wishlist = await User.removeFromWishlist(userId, productId);
    res.json({ message: 'Removed from wishlist successfully', wishlist });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
};

const getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const wishlist = await User.getWishlist(userId);
    res.json({ wishlist });
  } catch (error) {
    console.error('Error getting wishlist:', error);
    res.status(500).json({ error: 'Failed to get wishlist' });
  }
};

// Cart operations
const addToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity = 1 } = req.body;

    console.log('Add to cart request:', { userId, productId, quantity });

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

const removeFromCart = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Remove from cart - Full request object:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params
    });
    
    // Check if body is undefined or empty
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('Request body is empty or undefined');
      return res.status(400).json({ error: 'Request body is required' });
    }
    
    const { productId } = req.body;

    if (!productId) {
      console.error('Product ID is missing from request body');
      return res.status(400).json({ error: 'Product ID is required' });
    }

    console.log('Removing product from cart:', productId, 'for user:', userId);
    const cart = new Cart();
    await cart.removeItem(userId, productId);

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    const cart = new Cart();
    await cart.updateQuantity(userId, productId, quantity);

    res.json({ message: 'Cart quantity updated successfully' });
  } catch (error) {
    console.error('Error updating cart quantity:', error);
    res.status(500).json({ error: 'Failed to update cart quantity' });
  }
};

const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = new Cart();
    const cartItems = await cart.getUserCart(userId);
    res.json({ cartItems });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
};

const getCartItemCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = new Cart();
    const count = await cart.getCartCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error getting cart item count:', error);
    res.status(500).json({ error: 'Failed to get cart item count' });
  }
};

// Save user preferences (address and payment info)
const saveUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const { savedAddress, savedPaymentInfo } = req.body;

    await User.saveUserPreferences(userId, { savedAddress, savedPaymentInfo });
    res.json({ message: 'User preferences saved successfully' });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    res.status(500).json({ error: 'Failed to save user preferences' });
  }
};

// Get user preferences
const getUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Controller: Getting preferences for user:', userId);
    
    const preferences = await User.getUserPreferences(userId);
    console.log('Controller: Retrieved preferences:', preferences);
    
    res.json(preferences);
  } catch (error) {
    console.error('Error getting user preferences:', error);
    console.error('Error details:', error.message);
    
    // Return empty preferences instead of error
    res.json({
      savedAddress: null,
      savedPaymentInfo: null
    });
  }
};

// Debug endpoint to check database state
const debugUserData = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      user: user.toJSON(),
      rawWishlist: user.wishlist,
      rawCart: user.cart_item,
      wishlistType: typeof user.wishlist,
      cartType: typeof user.cart_item
    });
  } catch (error) {
    console.error('Error getting debug data:', error);
    res.status(500).json({ error: 'Failed to get debug data' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  registerUser,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  getCart,
  getCartItemCount,
  saveUserPreferences,
  getUserPreferences,
  debugUserData
};
