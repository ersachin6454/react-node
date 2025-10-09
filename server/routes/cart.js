const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount
} = require('../controllers/cartController');

// Cart routes
router.post('/:userId/items', addToCart);
router.get('/:userId', getCart);
router.put('/:userId/items/:productId', updateCartItem);
router.delete('/:userId/items/:productId', removeFromCart);
router.delete('/:userId', clearCart);
router.get('/:userId/count', getCartCount);

module.exports = router;
