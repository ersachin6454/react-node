import React, { useState } from 'react';
import '../styles/AddProduct.css';

function AddProduct({ onBack, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    specifications: '',
    images: [],
    is_active: true,
    variant_prices: {
      '400 gram': { price: '', sell_price: '' },
      '800 gram': { price: '', sell_price: '' },
      '1.2kg': { price: '', sell_price: '' }
    }
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);

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

  const handleBulkFileChange = (e) => {
    setBulkFile(e.target.files[0]);
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

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) {
      setMessage('Please select a CSV file');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', bulkFile);

      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/products/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Successfully uploaded ${data.count || 0} products!`);
        setTimeout(() => {
          onSave && onSave();
        }, 2000);
      } else {
        setMessage(data.error || 'Failed to upload products');
      }
    } catch (error) {
      console.error('Error uploading products:', error);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Upload images first
      let imageUrls = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadImages(selectedImages);
      }

      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          images: imageUrls
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Product added successfully!');
        setFormData({
          name: '',
          description: '',
          quantity: '',
          specifications: '',
          images: [],
          is_active: true,
          variant_prices: {
            '400 gram': { price: '', sell_price: '' },
            '800 gram': { price: '', sell_price: '' },
            '1.2kg': { price: '', sell_price: '' }
          }
        });
        setSelectedImages([]);
        setImagePreviews([]);
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

      <div className="add-product-tabs">
        <button
          type="button"
          className={!bulkUploadMode ? 'active' : ''}
          onClick={() => setBulkUploadMode(false)}
        >
          Add Single Product
        </button>
        <button
          type="button"
          className={bulkUploadMode ? 'active' : ''}
          onClick={() => setBulkUploadMode(true)}
        >
          Bulk Upload Products
        </button>
      </div>

      {bulkUploadMode ? (
        <form onSubmit={handleBulkUpload} className="add-product-form">
          {message && (
            <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="bulkFile">Upload CSV File *</label>
            <input
              type="file"
              id="bulkFile"
              accept=".csv"
              onChange={handleBulkFileChange}
              required
            />
            <p className="help-text">
              CSV format: name, price, sell_price, description, quantity, specifications (comma-separated)
            </p>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload Products'}
            </button>
          </div>
        </form>
      ) : (
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

          <div className="form-group">
            <label>Variant Prices *</label>
            <div className="variant-prices-section" style={{ marginTop: '10px' }}>
              <div className="variant-price-row" style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '1rem' }}>400 gram</label>
                <div className="variant-price-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>Original Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.variant_prices['400 gram'].price}
                      onChange={(e) => setFormData({
                        ...formData,
                        variant_prices: {
                          ...formData.variant_prices,
                          '400 gram': {
                            ...formData.variant_prices['400 gram'],
                            price: e.target.value
                          }
                        }
                      })}
                      style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>Selling Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.variant_prices['400 gram'].sell_price}
                      onChange={(e) => setFormData({
                        ...formData,
                        variant_prices: {
                          ...formData.variant_prices,
                          '400 gram': {
                            ...formData.variant_prices['400 gram'],
                            sell_price: e.target.value
                          }
                        }
                      })}
                      style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                    />
                  </div>
                </div>
              </div>
              <div className="variant-price-row" style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '1rem' }}>800 gram</label>
                <div className="variant-price-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>Original Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.variant_prices['800 gram'].price}
                      onChange={(e) => setFormData({
                        ...formData,
                        variant_prices: {
                          ...formData.variant_prices,
                          '800 gram': {
                            ...formData.variant_prices['800 gram'],
                            price: e.target.value
                          }
                        }
                      })}
                      style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>Selling Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.variant_prices['800 gram'].sell_price}
                      onChange={(e) => setFormData({
                        ...formData,
                        variant_prices: {
                          ...formData.variant_prices,
                          '800 gram': {
                            ...formData.variant_prices['800 gram'],
                            sell_price: e.target.value
                          }
                        }
                      })}
                      style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                    />
                  </div>
                </div>
              </div>
              <div className="variant-price-row" style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '1rem' }}>1.2kg</label>
                <div className="variant-price-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>Original Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.variant_prices['1.2kg'].price}
                      onChange={(e) => setFormData({
                        ...formData,
                        variant_prices: {
                          ...formData.variant_prices,
                          '1.2kg': {
                            ...formData.variant_prices['1.2kg'],
                            price: e.target.value
                          }
                        }
                      })}
                      style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}>Selling Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.variant_prices['1.2kg'].sell_price}
                      onChange={(e) => setFormData({
                        ...formData,
                        variant_prices: {
                          ...formData.variant_prices,
                          '1.2kg': {
                            ...formData.variant_prices['1.2kg'],
                            sell_price: e.target.value
                          }
                        }
                      })}
                      style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                    />
                  </div>
                </div>
              </div>
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
            <label>Product Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="file-input"
            />
            {imagePreviews.length > 0 && (
              <div className="image-previews">
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
      )}
    </div>
  );
}

export default AddProduct;
