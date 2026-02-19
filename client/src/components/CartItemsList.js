import React, { useState, useEffect } from 'react';
import '../styles/CartItemsList.css';

function CartItemsList() {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCartItems();
    }, []);

    const fetchCartItems = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/admin/cart-items', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch cart items');
            }

            const data = await response.json();
            setCartItems(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading cart items...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    // Group cart items by product
    const productStats = {};
    cartItems.forEach(item => {
        if (!productStats[item.product_id]) {
            productStats[item.product_id] = {
                product_id: item.product_id,
                product_name: item.product_name,
                product_price: item.product_price,
                product_images: item.product_images,
                total_quantity: 0,
                user_count: 0,
                users: []
            };
        }
        productStats[item.product_id].total_quantity += item.quantity;
        productStats[item.product_id].user_count += 1;
        productStats[item.product_id].users.push({
            user_name: item.user_name,
            user_email: item.user_email,
            quantity: item.quantity
        });
    });

    const productArray = Object.values(productStats);

    return (
        <div className="cart-items-list">
            <div className="section-header">
                <h2>Cart Items Analytics</h2>
                <p>Total items in carts: {cartItems.length}</p>
                <p>Unique products: {productArray.length}</p>
            </div>

            {productArray.length === 0 ? (
                <div className="empty-state">
                    <p>No items in any user's cart</p>
                </div>
            ) : (
                <div className="cart-items-grid">
                    {productArray.map((product) => (
                        <div key={product.product_id} className="cart-item-card">
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
                                    <div className="stat">
                                        <span className="stat-label">Total Quantity:</span>
                                        <span className="stat-value">{product.total_quantity}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Users:</span>
                                        <span className="stat-value">{product.user_count}</span>
                                    </div>
                                </div>
                                <div className="users-list">
                                    <strong>Users with this item:</strong>
                                    <ul>
                                        {product.users.map((user, idx) => (
                                            <li key={idx}>
                                                {user.user_name} ({user.user_email}) - Qty: {user.quantity}
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

export default CartItemsList;

