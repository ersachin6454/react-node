import React, { useState, useEffect } from 'react';
import '../styles/WishlistItemsList.css';

function WishlistItemsList() {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWishlistItems();
    }, []);

    const fetchWishlistItems = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/admin/wishlist-items', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch wishlist items');
            }

            const data = await response.json();
            setWishlistItems(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading wishlist items...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    // Group wishlist items by product
    const productStats = {};
    wishlistItems.forEach(item => {
        if (!productStats[item.product_id]) {
            productStats[item.product_id] = {
                product_id: item.product_id,
                product_name: item.product_name,
                product_price: item.product_price,
                product_images: item.product_images,
                user_count: 0,
                users: []
            };
        }
        productStats[item.product_id].user_count += 1;
        productStats[item.product_id].users.push({
            user_name: item.user_name,
            user_email: item.user_email
        });
    });

    const productArray = Object.values(productStats);

    // Sort by user count (most popular first)
    productArray.sort((a, b) => b.user_count - a.user_count);

    return (
        <div className="wishlist-items-list">
            <div className="section-header">
                <h2>Wishlist Items Analytics</h2>
                <p>Total wishlist entries: {wishlistItems.length}</p>
                <p>Unique products: {productArray.length}</p>
            </div>

            {productArray.length === 0 ? (
                <div className="empty-state">
                    <p>No items in any user's wishlist</p>
                </div>
            ) : (
                <div className="wishlist-items-grid">
                    {productArray.map((product) => (
                        <div key={product.product_id} className="wishlist-item-card">
                            <div className="item-image">
                                <img
                                    src={product.product_images && product.product_images.length > 0
                                        ? (typeof product.product_images === 'string'
                                            ? JSON.parse(product.product_images)[0]
                                            : product.product_images[0])
                                        : 'https://via.placeholder.com/150?text=No+Image'}
                                    alt={product.product_name}
                                />
                            </div>
                            <div className="item-info">
                                <h3>{product.product_name}</h3>
                                <p className="price">${product.product_price}</p>
                                <div className="stats">
                                    <div className="stat highlight">
                                        <span className="stat-label">In Wishlists:</span>
                                        <span className="stat-value">{product.user_count} users</span>
                                    </div>
                                </div>
                                <div className="users-list">
                                    <strong>Users who wishlisted:</strong>
                                    <ul>
                                        {product.users.map((user, idx) => (
                                            <li key={idx}>
                                                {user.user_name} ({user.user_email})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default WishlistItemsList;

