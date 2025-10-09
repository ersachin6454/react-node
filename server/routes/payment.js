const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  handleWebhook,
  testStripeConnection,
  processPayment
} = require('../controllers/paymentController');

// Payment routes
router.post('/:userId/create-intent', createPaymentIntent);
router.post('/:userId/confirm', confirmPayment);
router.post('/:userId/process', processPayment);
router.get('/payment-intent/:paymentIntentId/status', getPaymentStatus);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.get('/test-connection', testStripeConnection);

module.exports = router;
