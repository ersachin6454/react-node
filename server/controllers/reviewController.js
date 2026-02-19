const Review = require('../models/Review');

// Create or update a review
const createReview = async (req, res) => {
    try {
        const { userId } = req.params;
        const { productId, orderId, rating, reviewText } = req.body;

        if (!productId || !rating) {
            return res.status(400).json({ error: 'Product ID and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Check if user already reviewed this product for this order
        const existingReview = await Review.getUserProductReview(userId, productId, orderId || null);

        if (existingReview) {
            // Update existing review
            const updatedReview = await Review.update(existingReview.id, {
                rating,
                review_text: reviewText || null
            });
            return res.json({ message: 'Review updated successfully', review: updatedReview });
        } else {
            // Create new review
            const newReview = await Review.create({
                user_id: userId,
                product_id: productId,
                order_id: orderId || null,
                rating,
                review_text: reviewText || null
            });
            return res.status(201).json({ message: 'Review submitted successfully', review: newReview });
        }
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
};

// Get reviews for a product
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.getProductReviews(productId);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

// Get user's review for a product
const getUserReview = async (req, res) => {
    try {
        const userId = req.user?.id || req.params.userId;
        const { productId } = req.params;
        const { orderId } = req.query;

        const review = await Review.getUserProductReview(userId, productId, orderId || null);
        res.json({ review });
    } catch (error) {
        console.error('Error fetching user review:', error);
        res.status(500).json({ error: 'Failed to fetch review' });
    }
};

// Get product average rating
const getProductRating = async (req, res) => {
    try {
        const { productId } = req.params;
        const ratingData = await Review.getProductAverageRating(productId);
        res.json(ratingData);
    } catch (error) {
        console.error('Error fetching product rating:', error);
        res.status(500).json({ error: 'Failed to fetch rating' });
    }
};

module.exports = {
    createReview,
    getProductReviews,
    getUserReview,
    getProductRating
};

