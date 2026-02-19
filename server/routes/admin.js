const express = require('express');
const router = express.Router();
const {
  adminLogin,
  createAdmin,
  getAdminProfile,
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getAllCartItems,
  getAllWishlistItems
} = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');
const { createProduct, getAllProducts, updateProduct, deleteProduct, toggleProductActive } = require('../controllers/productController');
const { uploadImages, bulkUploadProducts } = require('../controllers/uploadController');
const { upload, uploadCSV } = require('../middleware/upload');

// Admin authentication routes
router.post('/login', adminLogin);
router.post('/create', createAdmin); // For initial admin setup

// Protected admin routes
router.get('/profile', adminAuth, getAdminProfile);

// Product management routes
router.post('/products', adminAuth, createProduct);
router.get('/products', adminAuth, getAllProducts);
router.put('/products/:id', adminAuth, updateProduct);
router.patch('/products/:id/toggle-active', adminAuth, toggleProductActive);
router.delete('/products/:id', adminAuth, deleteProduct);

// User management routes
router.get('/users', adminAuth, getAllUsers);
router.post('/users', adminAuth, createUser);
router.put('/users/:id/role', adminAuth, updateUserRole);
router.delete('/users/:id', adminAuth, deleteUser);

// Cart and Wishlist analytics routes
router.get('/cart-items', adminAuth, getAllCartItems);
router.get('/wishlist-items', adminAuth, getAllWishlistItems);

// Image upload routes
router.post('/upload-images', adminAuth, upload.array('images', 10), uploadImages);

// Bulk product upload route
router.post('/products/bulk-upload', adminAuth, uploadCSV.single('file'), bulkUploadProducts);

module.exports = router;
