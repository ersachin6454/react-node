const express = require('express');
const router = express.Router();
const {
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
  updateUserProfile,
  getShippingAddresses,
  addShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  setDefaultShippingAddress
} = require('../controllers/userController');

// GET /api/users - Get all users
router.get('/', getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById);

// POST /api/users - Create new user
router.post('/', createUser);

// POST /api/users/login - User login
router.post('/login', loginUser);

// POST /api/users/register - User registration
router.post('/register', registerUser);

// PUT /api/users/:id - Update user
router.put('/:id', updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', deleteUser);

// Wishlist routes
// POST /api/users/:userId/wishlist - Add to wishlist
router.post('/:userId/wishlist', addToWishlist);

// DELETE /api/users/:userId/wishlist - Remove from wishlist
router.delete('/:userId/wishlist', removeFromWishlist);

// GET /api/users/:userId/wishlist - Get wishlist
router.get('/:userId/wishlist', getWishlist);

// Cart routes
// POST /api/users/:userId/cart - Add to cart
router.post('/:userId/cart', addToCart);

// DELETE /api/users/:userId/cart - Remove from cart
router.delete('/:userId/cart', removeFromCart);

// PUT /api/users/:userId/cart - Update cart quantity
router.put('/:userId/cart', updateCartQuantity);

// GET /api/users/:userId/cart - Get cart
router.get('/:userId/cart', getCart);

// GET /api/users/:userId/cart/count - Get cart item count
router.get('/:userId/cart/count', getCartItemCount);

// User preferences routes
// POST /api/users/:userId/preferences - Save user preferences
router.post('/:userId/preferences', saveUserPreferences);

// GET /api/users/:userId/preferences - Get user preferences
router.get('/:userId/preferences', getUserPreferences);

// Profile management routes
// PUT /api/users/:userId/profile - Update user profile
router.put('/:userId/profile', updateUserProfile);

// Shipping addresses routes
// GET /api/users/:userId/shipping-addresses - Get all shipping addresses
router.get('/:userId/shipping-addresses', getShippingAddresses);

// POST /api/users/:userId/shipping-addresses - Add shipping address
router.post('/:userId/shipping-addresses', addShippingAddress);

// PUT /api/users/:userId/shipping-addresses/:addressId - Update shipping address
router.put('/:userId/shipping-addresses/:addressId', updateShippingAddress);

// DELETE /api/users/:userId/shipping-addresses/:addressId - Delete shipping address
router.delete('/:userId/shipping-addresses/:addressId', deleteShippingAddress);

// PUT /api/users/:userId/shipping-addresses/:addressId/default - Set default shipping address
router.put('/:userId/shipping-addresses/:addressId/default', setDefaultShippingAddress);

module.exports = router;
