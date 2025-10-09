import React, { useState, useEffect } from 'react';
import '../styles/ProductList.css';

function ProductList({ onEditProduct, onAddProduct }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        setError('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Network error while fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProducts(products.filter(product => product.id !== productId));
        setDeleteConfirm(null);
      } else {
        setError('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Network error while deleting product');
    }
  };

  if (loading) {
    return (
      <div className="product-list-container">
        <div className="loading">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <h2>Product Management</h2>
        <button onClick={onAddProduct} className="add-product-btn">
          Add New Product
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <div className="no-products">
          <p>No products found. Add your first product!</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img 
                  src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/200x150?text=No+Image'} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x150?text=Image+Not+Found';
                  }}
                />
              </div>
              
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                
                <div className="product-details">
                  <div className="price-info">
                    <span className="current-price">${product.sell_price}</span>
                    {product.price && product.price > product.sell_price && (
                      <span className="original-price">${product.price}</span>
                    )}
                  </div>
                  
                  <div className="stock-info">
                    <span className="stock-label">Stock:</span>
                    <span className="stock-quantity">{product.quantity}</span>
                  </div>
                </div>
              </div>
              
              <div className="product-actions">
                <button 
                  onClick={() => onEditProduct(product)}
                  className="edit-btn"
                >
                  Edit
                </button>
                <button 
                  onClick={() => setDeleteConfirm(product.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <div className="delete-modal">
          <div className="delete-modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="delete-modal-actions">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirm)}
                className="confirm-delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductList;
