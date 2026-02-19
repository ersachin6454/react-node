const { pool } = require('../config/database');

class Review {
    // Create a new review
    static async create(reviewData) {
        try {
            const { user_id, product_id, order_id, rating, review_text } = reviewData;

            const [result] = await pool.execute(
                `INSERT INTO product_reviews (user_id, product_id, order_id, rating, review_text) 
         VALUES (?, ?, ?, ?, ?)`,
                [user_id, product_id, order_id || null, rating, review_text || null]
            );

            return { id: result.insertId, ...reviewData };
        } catch (error) {
            console.error('Error creating review:', error);
            throw error;
        }
    }

    // Get review by ID
    static async findById(reviewId) {
        try {
            const [rows] = await pool.execute(
                `SELECT r.*, u.name as user_name, u.email as user_email 
         FROM product_reviews r
         JOIN users u ON r.user_id = u.id
         WHERE r.id = ?`,
                [reviewId]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching review:', error);
            throw error;
        }
    }

    // Get reviews for a product
    static async getProductReviews(productId) {
        try {
            const [rows] = await pool.execute(
                `SELECT r.*, u.name as user_name 
         FROM product_reviews r
         JOIN users u ON r.user_id = u.id
         WHERE r.product_id = ?
         ORDER BY r.created_at DESC`,
                [productId]
            );
            return rows;
        } catch (error) {
            console.error('Error fetching product reviews:', error);
            throw error;
        }
    }

    // Get user's review for a product
    static async getUserProductReview(userId, productId, orderId = null) {
        try {
            let query = `SELECT * FROM product_reviews 
                   WHERE user_id = ? AND product_id = ?`;
            let params = [userId, productId];

            if (orderId) {
                query += ` AND order_id = ?`;
                params.push(orderId);
            }

            const [rows] = await pool.execute(query, params);
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching user review:', error);
            throw error;
        }
    }

    // Update review
    static async update(reviewId, reviewData) {
        try {
            const { rating, review_text } = reviewData;

            await pool.execute(
                `UPDATE product_reviews 
         SET rating = ?, review_text = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
                [rating, review_text, reviewId]
            );

            return await this.findById(reviewId);
        } catch (error) {
            console.error('Error updating review:', error);
            throw error;
        }
    }

    // Delete review
    static async delete(reviewId) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM product_reviews WHERE id = ?',
                [reviewId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting review:', error);
            throw error;
        }
    }

    // Get average rating for a product
    static async getProductAverageRating(productId) {
        try {
            const [rows] = await pool.execute(
                `SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews
         FROM product_reviews
         WHERE product_id = ?`,
                [productId]
            );
            return {
                averageRating: parseFloat(rows[0].average_rating || 0).toFixed(1),
                totalReviews: rows[0].total_reviews || 0
            };
        } catch (error) {
            console.error('Error fetching average rating:', error);
            throw error;
        }
    }
}

module.exports = Review;

