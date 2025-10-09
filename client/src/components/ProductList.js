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
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-image-cell">
                      <img 
                        src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/60x60?text=No+Image'} 
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/60x60?text=Image+Not+Found';
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    <div className="product-name-cell">
                      <strong>{product.name}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="product-description-cell">
                      {product.description ? (
                        <span title={product.description}>
                          {product.description.length > 50 
                            ? `${product.description.substring(0, 50)}...` 
                            : product.description
                          }
                        </span>
                      ) : (
                        <span className="no-description">No description</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="product-price-cell">
                      <div className="current-price">${product.sell_price}</div>
                      {product.price && product.price > product.sell_price && (
                        <div className="original-price">${product.price}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="product-stock-cell">
                      <span className={`stock-badge ${product.quantity > 10 ? 'in-stock' : product.quantity > 0 ? 'low-stock' : 'out-of-stock'}`}>
                        {product.quantity}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="product-date-cell">
                      {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="product-actions-cell">
                      <button 
                        onClick={() => onEditProduct(product)}
                        className="edit-btn"
                        title="Edit Product"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(product.id)}
                        className="delete-btn"
                        title="Delete Product"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
