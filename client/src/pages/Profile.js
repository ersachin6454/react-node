import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaEdit, FaTrash, FaPlus, FaCheck, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import Notification from '../components/Notification';
import RateReviewModal from '../components/RateReviewModal';
import '../styles/Profile.css';

function Profile() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('account'); // 'account', 'orders'
    const [profile, setProfile] = useState({ name: '', email: '', mobile_number: '' });
    const [shippingAddresses, setShippingAddresses] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [editingProfile, setEditingProfile] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: 'info', isVisible: false });

    const [profileForm, setProfileForm] = useState({
        name: '',
        mobile_number: ''
    });

    const [addressForm, setAddressForm] = useState({
        full_name: '',
        mobile_number: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
        is_default: false
    });

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/');
            return;
        }
        fetchProfile();
        fetchShippingAddresses();
    }, [user?.id, isAuthenticated, navigate]);

    useEffect(() => {
        if (activeTab === 'orders' && user?.id) {
            fetchOrders();
        }
    }, [activeTab, user?.id]);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`/api/users/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
                setProfileForm({
                    name: data.name || '',
                    mobile_number: data.mobile_number || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            showNotification('Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchShippingAddresses = async () => {
        try {
            const response = await fetch(`/api/users/${user.id}/shipping-addresses`);
            if (response.ok) {
                const data = await response.json();
                setShippingAddresses(data);
            }
        } catch (error) {
            console.error('Error fetching shipping addresses:', error);
        }
    };

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type, isVisible: true });
    };

    const hideNotification = () => {
        setNotification(prev => ({ ...prev, isVisible: false }));
    };

    const handleProfileUpdate = async () => {
        try {
            const response = await fetch(`/api/users/${user.id}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileForm)
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data.user);
                setEditingProfile(false);
                showNotification('Profile updated successfully!', 'success');
            } else {
                const error = await response.json();
                showNotification(error.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            showNotification('Failed to update profile', 'error');
        }
    };

    const handleAddAddress = async () => {
        try {
            const response = await fetch(`/api/users/${user.id}/shipping-addresses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addressForm)
            });

            if (response.ok) {
                showNotification('Shipping address added successfully!', 'success');
                setShowAddAddress(false);
                resetAddressForm();
                fetchShippingAddresses();
            } else {
                const error = await response.json();
                showNotification(error.error || 'Failed to add address', 'error');
            }
        } catch (error) {
            showNotification('Failed to add address', 'error');
        }
    };

    const handleUpdateAddress = async () => {
        try {
            const response = await fetch(`/api/users/${user.id}/shipping-addresses/${editingAddress.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addressForm)
            });

            if (response.ok) {
                showNotification('Shipping address updated successfully!', 'success');
                setEditingAddress(null);
                resetAddressForm();
                fetchShippingAddresses();
            } else {
                const error = await response.json();
                showNotification(error.error || 'Failed to update address', 'error');
            }
        } catch (error) {
            showNotification('Failed to update address', 'error');
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) {
            return;
        }

        try {
            const response = await fetch(`/api/users/${user.id}/shipping-addresses/${addressId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('Shipping address deleted successfully!', 'success');
                fetchShippingAddresses();
            } else {
                const error = await response.json();
                showNotification(error.error || 'Failed to delete address', 'error');
            }
        } catch (error) {
            showNotification('Failed to delete address', 'error');
        }
    };

    const handleSetDefault = async (addressId) => {
        try {
            const response = await fetch(`/api/users/${user.id}/shipping-addresses/${addressId}/default`, {
                method: 'PUT'
            });

            if (response.ok) {
                showNotification('Default address updated successfully!', 'success');
                fetchShippingAddresses();
            } else {
                const error = await response.json();
                showNotification(error.error || 'Failed to set default address', 'error');
            }
        } catch (error) {
            showNotification('Failed to set default address', 'error');
        }
    };

    const resetAddressForm = () => {
        setAddressForm({
            full_name: '',
            mobile_number: '',
            address_line1: '',
            address_line2: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'India',
            is_default: false
        });
    };

    const startEditAddress = (address) => {
        setEditingAddress(address);
        setAddressForm({
            full_name: address.full_name,
            mobile_number: address.mobile_number,
            address_line1: address.address_line1,
            address_line2: address.address_line2 || '',
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
            country: address.country || 'India',
            is_default: address.is_default || false
        });
        setShowAddAddress(false);
    };

    const cancelEdit = () => {
        setEditingAddress(null);
        setShowAddAddress(false);
        resetAddressForm();
    };

    const fetchOrders = async () => {
        try {
            setOrdersLoading(true);
            const response = await fetch(`/api/orders/user/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setOrders(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setOrdersLoading(false);
        }
    };


    if (loading) {
        return (
            <div className="profile-container">
                <div className="loading">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>My Profile</h1>
                <p>Manage your account and orders</p>
            </div>

            {/* Tabs */}
            <div className="profile-tabs">
                <button
                    className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
                    onClick={() => setActiveTab('account')}
                >
                    Account
                </button>
                <button
                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Orders
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'account' && (
                <>

                    {/* Profile Information Section */}
                    <div className="profile-section">
                        <div className="section-header">
                            <h2>Profile Information</h2>
                            {!editingProfile && (
                                <button className="edit-btn" onClick={() => setEditingProfile(true)}>
                                    <FaEdit /> Edit
                                </button>
                            )}
                        </div>

                        {editingProfile ? (
                            <div className="profile-form">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.name}
                                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="disabled-input"
                                    />
                                    <small>Email cannot be changed</small>
                                </div>
                                <div className="form-group">
                                    <label>Mobile Number</label>
                                    <input
                                        type="tel"
                                        value={profileForm.mobile_number}
                                        onChange={(e) => setProfileForm({ ...profileForm, mobile_number: e.target.value })}
                                        placeholder="Enter mobile number"
                                    />
                                </div>
                                <div className="form-actions">
                                    <button className="save-btn" onClick={handleProfileUpdate}>
                                        <FaCheck /> Save
                                    </button>
                                    <button className="cancel-btn" onClick={() => {
                                        setEditingProfile(false);
                                        setProfileForm({
                                            name: profile.name || '',
                                            mobile_number: profile.mobile_number || ''
                                        });
                                    }}>
                                        <FaTimes /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="profile-info">
                                <div className="info-item">
                                    <label>Name:</label>
                                    <span>{profile.name || 'Not set'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Email:</label>
                                    <span>{profile.email}</span>
                                </div>
                                <div className="info-item">
                                    <label>Mobile Number:</label>
                                    <span>{profile.mobile_number || 'Not set'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Shipping Addresses Section */}
                    <div className="profile-section">
                        <div className="section-header">
                            <h2>Shipping Addresses</h2>
                            {!showAddAddress && !editingAddress && (
                                <button className="add-btn" onClick={() => setShowAddAddress(true)}>
                                    <FaPlus /> Add Address
                                </button>
                            )}
                        </div>

                        {/* Add/Edit Address Form */}
                        {(showAddAddress || editingAddress) && (
                            <div className="address-form">
                                <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            value={addressForm.full_name}
                                            onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Mobile Number *</label>
                                        <input
                                            type="tel"
                                            value={addressForm.mobile_number}
                                            onChange={(e) => setAddressForm({ ...addressForm, mobile_number: e.target.value })}
                                            placeholder="Enter mobile number"
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Address Line 1 *</label>
                                        <input
                                            type="text"
                                            value={addressForm.address_line1}
                                            onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                                            placeholder="Street address, P.O. box"
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Address Line 2</label>
                                        <input
                                            type="text"
                                            value={addressForm.address_line2}
                                            onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                                            placeholder="Apartment, suite, unit, building, floor, etc."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>City *</label>
                                        <input
                                            type="text"
                                            value={addressForm.city}
                                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                            placeholder="Enter city"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>State *</label>
                                        <input
                                            type="text"
                                            value={addressForm.state}
                                            onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                            placeholder="Enter state"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Postal Code *</label>
                                        <input
                                            type="text"
                                            value={addressForm.postal_code}
                                            onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                                            placeholder="Enter postal code"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Country</label>
                                        <input
                                            type="text"
                                            value={addressForm.country}
                                            onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                                            placeholder="Enter country"
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={addressForm.is_default}
                                                onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                                            />
                                            Set as default address
                                        </label>
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button className="save-btn" onClick={editingAddress ? handleUpdateAddress : handleAddAddress}>
                                        <FaCheck /> {editingAddress ? 'Update' : 'Add'} Address
                                    </button>
                                    <button className="cancel-btn" onClick={cancelEdit}>
                                        <FaTimes /> Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Addresses List */}
                        {shippingAddresses.length === 0 && !showAddAddress && !editingAddress ? (
                            <div className="empty-state">
                                <FaMapMarkerAlt />
                                <p>No shipping addresses added yet</p>
                                <p>Click "Add Address" to add your first shipping address</p>
                            </div>
                        ) : (
                            <div className="addresses-list">
                                {shippingAddresses.map((address) => (
                                    <div key={address.id} className={`address-card ${address.is_default ? 'default' : ''}`}>
                                        {address.is_default && <span className="default-badge">Default</span>}
                                        <div className="address-content">
                                            <h3>{address.full_name}</h3>
                                            <p>{address.mobile_number}</p>
                                            <p>{address.address_line1}</p>
                                            {address.address_line2 && <p>{address.address_line2}</p>}
                                            <p>{address.city}, {address.state} {address.postal_code}</p>
                                            <p>{address.country}</p>
                                        </div>
                                        <div className="address-actions">
                                            {!address.is_default && (
                                                <button
                                                    className="default-btn"
                                                    onClick={() => handleSetDefault(address.id)}
                                                    title="Set as default"
                                                >
                                                    Set Default
                                                </button>
                                            )}
                                            <button
                                                className="edit-btn"
                                                onClick={() => startEditAddress(address)}
                                                title="Edit address"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteAddress(address.id)}
                                                title="Delete address"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'orders' && (
                <div className="profile-section">
                    <div className="section-header">
                        <h2>My Orders</h2>
                    </div>
                    {ordersLoading ? (
                        <div className="loading">Loading orders...</div>
                    ) : orders.length === 0 ? (
                        <div className="empty-state">
                            <p>No orders found</p>
                            <button className="primary-btn" onClick={() => navigate('/products')}>
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="orders-list">
                            {orders.map((order) => (
                                order.items && order.items.length > 0 ? (
                                    order.items.map((item, itemIndex) => (
                                        <div key={`${order.id}-${item.id || itemIndex}`} className="order-item-card-screenshot">
                                            <div className="order-item-image-container">
                                                <img
                                                    src={item.images && item.images.length > 0
                                                        ? item.images[0]
                                                        : 'https://via.placeholder.com/150x150?text=No+Image'}
                                                    alt={item.product_name}
                                                    className="order-item-img"
                                                    onClick={() => navigate(`/product/${item.product_id}`)}
                                                />
                                            </div>

                                            <div className="order-item-content">
                                                <div className="order-item-main-info">
                                                    <h3
                                                        className="order-item-title"
                                                        onClick={() => navigate(`/product/${item.product_id}`)}
                                                    >
                                                        {item.product_name}
                                                    </h3>
                                                    <div className="order-item-specs">
                                                        <span>Qty: {item.quantity}</span>
                                                    </div>
                                                </div>

                                                <div className="order-item-price-section">
                                                    <span className="order-item-price">${(parseFloat(item.price || 0) * parseInt(item.quantity || 0)).toFixed(2)}</span>
                                                </div>

                                                <div className="order-item-status-section">
                                                    <div className="status-indicator-wrapper">
                                                        <span className={`status-dot ${order.status?.toLowerCase() || 'pending'}`}></span>
                                                        <div className="status-text-group">
                                                            <span className={`order-status-text ${order.status?.toLowerCase() || 'pending'}`}>
                                                                {order.status === 'delivered' ? `Delivered on ${new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` :
                                                                    order.status === 'paid' ? 'Confirmed' :
                                                                        order.status === 'shipped' ? 'Shipped' :
                                                                            order.status === 'cancelled' ? 'Cancelled' :
                                                                                order.status === 'refunded' ? 'Refund Completed' : 'Pending'}
                                                            </span>
                                                            <p className="status-message">
                                                                {order.status === 'delivered' ? 'Your item has been delivered.' :
                                                                    order.status === 'refunded' ? 'You returned this order because you did not like the fit.' :
                                                                        order.status === 'cancelled' ? 'This order has been cancelled.' :
                                                                            order.status === 'shipped' ? 'Your item has been shipped.' :
                                                                                'Your order is being processed.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="order-item-actions">
                                                        <button
                                                            className="rate-review-btn"
                                                            onClick={() => {
                                                                setSelectedProduct(item);
                                                                setSelectedOrderId(order.id);
                                                                setReviewModalOpen(true);
                                                            }}
                                                        >
                                                            <span>⭐</span> Rate & Review Product
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {order.status === 'refunded' && (
                                                <div className="refund-info-box">
                                                    <div className="refund-header">
                                                        Refund Completed (Refund ID: {order.id}{item.id || itemIndex})
                                                    </div>
                                                    <div className="refund-details">
                                                        <p>• Refund was added to your Bank Account linked with UPI ID *******6454@okhdfcbank on {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.</p>
                                                        <p>• If you can't see the refund in your bank statement(bank app/passbook), contact your bank and share refund reference number {order.id}{item.id || itemIndex} to track it.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="order-item-card-screenshot">
                                        <div className="order-item-content">
                                            <p>No items found in this order</p>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>
            )}


            <Notification
                message={notification.message}
                type={notification.type}
                isVisible={notification.isVisible}
                onClose={hideNotification}
            />

            <RateReviewModal
                isOpen={reviewModalOpen}
                onClose={() => {
                    setReviewModalOpen(false);
                    setSelectedProduct(null);
                    setSelectedOrderId(null);
                }}
                product={selectedProduct}
                orderId={selectedOrderId}
                userId={user?.id}
                onReviewSubmitted={(review) => {
                    showNotification('Review submitted successfully!', 'success');
                }}
            />
        </div>
    );
}

export default Profile;

