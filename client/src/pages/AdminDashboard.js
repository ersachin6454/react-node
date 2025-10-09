import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AddProduct from '../components/AddProduct';
import ProductList from '../components/ProductList';
import EditProduct from '../components/EditProduct';
import UserManagement from '../components/UserManagement';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [adminUser, setAdminUser] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'add', 'edit'
  const [editingProduct, setEditingProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    if (!token || !user) {
      navigate('/admin/login');
      return;
    }
    
    setAdminUser(JSON.parse(user));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleAddProduct = () => {
    setCurrentView('add');
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setCurrentView('edit');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingProduct(null);
  };

  const handleProductSaved = () => {
    setCurrentView('list');
    setEditingProduct(null);
  };

  if (!adminUser) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Admin Dashboard</h1>
          <div className="admin-user-info">
            <span>Welcome, {adminUser.name || adminUser.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="admin-nav">
        <button 
          className={`nav-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Manage Products
        </button>
        <button 
          className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Manage Users
        </button>
        <button 
          className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
      </nav>

      <main className="admin-main">
        {activeTab === 'products' && (
          <>
            {currentView === 'list' && (
              <ProductList 
                onEditProduct={handleEditProduct}
                onAddProduct={handleAddProduct}
              />
            )}
            {currentView === 'add' && (
              <AddProduct onBack={handleBackToList} onSave={handleProductSaved} />
            )}
            {currentView === 'edit' && editingProduct && (
              <EditProduct 
                product={editingProduct}
                onSave={handleProductSaved}
                onCancel={handleBackToList}
              />
            )}
          </>
        )}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'orders' && (
          <div className="admin-section">
            <h2>Order Management</h2>
            <p>Order management functionality will be implemented here.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
