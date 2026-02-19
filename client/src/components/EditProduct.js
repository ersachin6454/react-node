import React, { useState, useEffect } from 'react';
import '../styles/EditProduct.css';

function EditProduct({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    sell_price: '',
    description: '',
    quantity: '',
    specifications: '',
    images: [],
    is_active: true
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
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
        specifications: product.specifications || '',
        images: product.images || [],
        is_active: product.is_active !== undefined ? product.is_active : true
      });

      // Set existing images
      if (product.images && product.images.length > 0) {
        setExistingImages(Array.isArray(product.images) ? product.images : [product.images]);
      } else {
        setExistingImages([]);
      }
    }
  }, [product]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...selectedImages, ...files];
    setSelectedImages(newImages);

    // Create previews
    const newPreviews = [];
    newImages.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === newImages.length) {
          setImagePreviews([...imagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const removeExistingImage = (index) => {
    const newExisting = existingImages.filter((_, i) => i !== index);
    setExistingImages(newExisting);
  };

  const uploadImages = async (files) => {
    const formData = new FormData();

    for (const file of files) {
      formData.append('images', file);
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/upload-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.urls || [];
      } else {
        throw new Error('Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Upload new images first
      let newImageUrls = [];
      if (selectedImages.length > 0) {
        newImageUrls = await uploadImages(selectedImages);
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls];

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          images: allImages
        }),
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
          <label htmlFor="specifications">Specifications</label>
          <textarea
            id="specifications"
            name="specifications"
            value={formData.specifications}
            onChange={handleChange}
            rows="4"
            placeholder="Enter product specifications (e.g., Size: Large, Color: Red, Material: Cotton)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="is_active" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <span>Product is Active (visible to customers)</span>
          </label>
        </div>

        <div className="form-group">
          <label>Product Images</label>
          {existingImages.length > 0 && (
            <div className="existing-images">
              <p>Existing Images:</p>
              <div className="image-previews">
                {existingImages.map((url, index) => (
                  <div key={index} className="image-preview">
                    <img src={url} alt={`Existing ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="remove-image-btn"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="file-input"
          />
          {imagePreviews.length > 0 && (
            <div className="image-previews">
              <p>New Images:</p>
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="remove-image-btn"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
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

