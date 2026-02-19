import React, { useState, useEffect } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import '../styles/RateReviewModal.css';

function RateReviewModal({ isOpen, onClose, product, orderId, userId, onReviewSubmitted }) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [loading, setLoading] = useState(false);
    const [existingReview, setExistingReview] = useState(null);

    useEffect(() => {
        if (isOpen && product && userId) {
            fetchExistingReview();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, product?.id, userId, orderId]);

    const fetchExistingReview = async () => {
        if (!userId || !product?.id) return;

        try {
            const response = await fetch(`/api/reviews/user/${userId}/product/${product.id}${orderId ? `?orderId=${orderId}` : ''}`);
            if (response.ok) {
                const data = await response.json();
                if (data.review) {
                    setExistingReview(data.review);
                    setRating(data.review.rating);
                    setReviewText(data.review.review_text || '');
                } else {
                    setExistingReview(null);
                    setRating(0);
                    setReviewText('');
                }
            }
        } catch (error) {
            console.error('Error fetching existing review:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        if (!userId) {
            alert('Please login to submit a review');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/reviews/user/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: product.id,
                    orderId: orderId || null,
                    rating: rating,
                    reviewText: reviewText.trim() || null
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (onReviewSubmitted) {
                    onReviewSubmitted(data.review);
                }
                onClose();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !product) return null;

    return (
        <div className="rate-review-modal-overlay" onClick={onClose}>
            <div className="rate-review-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Rate & Review Product</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="product-info">
                        {product.images && product.images.length > 0 && (
                            <img
                                src={product.images[0]}
                                alt={product.name}
                                className="product-image"
                            />
                        )}
                        <div className="product-details">
                            <h3>{product.name}</h3>
                            <p className="product-price">${product.sell_price}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="review-form">
                        <div className="rating-section">
                            <label>Rate this product *</label>
                            <div className="star-rating">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <FaStar
                                        key={star}
                                        className={`star ${star <= (hoveredRating || rating) ? 'filled' : ''}`}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        onClick={() => setRating(star)}
                                    />
                                ))}
                                {rating > 0 && (
                                    <span className="rating-text">
                                        {rating === 1 ? 'Poor' :
                                            rating === 2 ? 'Fair' :
                                                rating === 3 ? 'Good' :
                                                    rating === 4 ? 'Very Good' : 'Excellent'}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="review-text-section">
                            <label htmlFor="reviewText">Write a review (optional)</label>
                            <textarea
                                id="reviewText"
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="Share your experience with this product..."
                                rows="6"
                                maxLength={1000}
                            />
                            <span className="char-count">{reviewText.length}/1000</span>
                        </div>

                        {existingReview && (
                            <div className="existing-review-note">
                                You have already reviewed this product. Submitting will update your existing review.
                            </div>
                        )}

                        <div className="modal-actions">
                            <button type="button" className="cancel-btn" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="submit-btn" disabled={loading || rating === 0}>
                                {loading ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default RateReviewModal;

