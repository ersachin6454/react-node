import React, { useState } from 'react';
import '../styles/AddProduct.css';

function AddProduct({ onBack, onSave }) {
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
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Product added successfully!');
        setFormData({
          name: '',
          price: '',
          sell_price: '',
          description: '',
          quantity: '',
          images: []
        });
        setImageUrls(['']);
        setTimeout(() => {
          onSave && onSave();
        }, 1500);
      } else {
        setMessage(data.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-container">
      <div className="add-product-header">
        <div className="header-content">
          <h2>Add New Product</h2>
          <p>Fill in the details below to add a new product to the store.</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="back-btn">
            ← Back to Products
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="add-product-form">
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
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProduct;
