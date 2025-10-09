const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const adminAuth = require('../middleware/adminAuth');

// Order routes
router.post('/', createOrder);
router.get('/user/:userId', getUserOrders);
router.get('/:orderId', getOrderById);

// Admin routes
router.get('/admin/all', adminAuth, getAllOrders);
router.put('/admin/:orderId/status', adminAuth, updateOrderStatus);

module.exports = router;
