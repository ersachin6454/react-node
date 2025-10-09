import React, { useState, useEffect } from 'react';
import '../styles/EditProduct.css';

function EditProduct({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    sell_price: '',
    description: '',
    quantity: '',
    images: []
  });
  const [imageUrls, setImageUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price || '',
        sell_price: product.sell_price || '',
        description: product.description || '',
        quantity: product.quantity || '',
        images: product.images || []
      });
      
      // Set image URLs for editing
      if (product.images && product.images.length > 0) {
        setImageUrls([...product.images, '']);
      } else {
        setImageUrls(['']);
      }
    }
  }, [product]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUrlChange = (index, value) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = value;
    setImageUrls(newImageUrls);
    
    // Update formData with non-empty URLs
    const validUrls = newImageUrls.filter(url => url.trim() !== '');
    setFormData({
      ...formData,
      images: validUrls
    });
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const removeImageUrl = (index) => {
    const newImageUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImageUrls);
    
    const validUrls = newImageUrls.filter(url => url.trim() !== '');
    setFormData({
      ...formData,
      images: validUrls
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Product updated successfully!');
        setTimeout(() => {
          onSave();
        }, 1500);
      } else {
        setMessage(data.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-product-container">
      <div className="edit-product-header">
        <h2>Edit Product</h2>
        <button onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="edit-product-form">
        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter product name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Quantity *</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="0"
              placeholder="Enter quantity"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Original Price *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              placeholder="Enter original price"
            />
          </div>

          <div className="form-group">
            <label htmlFor="sell_price">Selling Price *</label>
            <input
              type="number"
              id="sell_price"
              name="sell_price"
              value={formData.sell_price}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              placeholder="Enter selling price"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Enter product description"
          />
        </div>

        <div className="form-group">
          <label>Product Images</label>
          <div className="image-urls-container">
            {imageUrls.map((url, index) => (
              <div key={index} className="image-url-input">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  placeholder="Enter image URL"
                />
                {imageUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImageUrl(index)}
                    className="remove-image-btn"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addImageUrl}
              className="add-image-btn"
            >
              Add Another Image
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProduct;
