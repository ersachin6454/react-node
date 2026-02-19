const express = require('express');
const router = express.Router();
const {
    createReview,
    getProductReviews,
    getUserReview,
    getProductRating
} = require('../controllers/reviewController');

// POST /api/reviews/user/:userId - Create or update a review
// No auth required - userId is validated in controller
router.post('/user/:userId', createReview);

// GET /api/reviews/product/:productId - Get all reviews for a product
router.get('/product/:productId', getProductReviews);

// GET /api/reviews/user/:userId/product/:productId - Get user's review for a product
router.get('/user/:userId/product/:productId', getUserReview);

// GET /api/reviews/product/:productId/rating - Get product average rating
router.get('/product/:productId/rating', getProductRating);

module.exports = router;

