const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByPriceRange,
  updateProductQuantity
} = require('../controllers/productController');

// GET /api/products - Get all products
router.get('/', getAllProducts);

// GET /api/products/search?q=searchTerm - Search products
router.get('/search', searchProducts);

// GET /api/products/price-range?min=10&max=100 - Get products by price range
router.get('/price-range', getProductsByPriceRange);

// GET /api/products/:id - Get product by ID
router.get('/:id', getProductById);

// POST /api/products - Create new product
router.post('/', createProduct);

// PUT /api/products/:id - Update product
router.put('/:id', updateProduct);

// PATCH /api/products/:id/quantity - Update product quantity
router.patch('/:id/quantity', updateProductQuantity);

// DELETE /api/products/:id - Delete product
router.delete('/:id', deleteProduct);

module.exports = router;
