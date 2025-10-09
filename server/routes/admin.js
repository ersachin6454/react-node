const express = require('express');
const router = express.Router();
const { adminLogin, createAdmin, getAdminProfile } = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');
const { createProduct, getAllProducts, updateProduct, deleteProduct } = require('../controllers/productController');

// Admin authentication routes
router.post('/login', adminLogin);
router.post('/create', createAdmin); // For initial admin setup

// Protected admin routes
router.get('/profile', adminAuth, getAdminProfile);

// Product management routes
router.post('/products', adminAuth, createProduct);
router.get('/products', adminAuth, getAllProducts);
router.put('/products/:id', adminAuth, updateProduct);
router.delete('/products/:id', adminAuth, deleteProduct);

module.exports = router;
