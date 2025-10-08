const Product = require('../models/Product');

const getAllProducts = async (req, res) => {
  try {
    const product = new Product();
    const products = await product.findAll();
    
    // Parse JSON images for each product
    const productsWithParsedImages = products.map(product => {
      let images = [];
      try {
        if (product.images && typeof product.images === 'string') {
          images = JSON.parse(product.images);
        } else if (Array.isArray(product.images)) {
          images = product.images;
        }
      } catch (error) {
        console.warn('Error parsing images for product:', product.id, error.message);
        images = [];
      }
      
      return {
        ...product,
        images: images
      };
    });
    
    res.json(productsWithParsedImages);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = new Product();
    const productData = await product.findById(id);
    
    if (!productData) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Parse JSON images
    let images = [];
    try {
      if (productData.images && typeof productData.images === 'string') {
        images = JSON.parse(productData.images);
      } else if (Array.isArray(productData.images)) {
        images = productData.images;
      }
    } catch (error) {
      console.warn('Error parsing images for product:', productData.id, error.message);
      images = [];
    }
    
    const productWithParsedImages = {
      ...productData,
      images: images
    };
    
    res.json(productWithParsedImages);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, price, sell_price, description, images, quantity } = req.body;
    
    // Basic validation
    if (!name || !price || !sell_price) {
      return res.status(400).json({ error: 'Name, price, and sell_price are required' });
    }
    
    const product = new Product();
    const newProduct = await product.create({
      name,
      price: parseFloat(price),
      sell_price: parseFloat(sell_price),
      description: description || '',
      images: images || [],
      quantity: parseInt(quantity) || 0
    });
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, sell_price, description, images, quantity } = req.body;
    
    // Basic validation
    if (!name || !price || !sell_price) {
      return res.status(400).json({ error: 'Name, price, and sell_price are required' });
    }
    
    const product = new Product();
    
    // Check if product exists
    const existingProduct = await product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const updatedProduct = await product.update(id, {
      name,
      price: parseFloat(price),
      sell_price: parseFloat(sell_price),
      description: description || '',
      images: images || [],
      quantity: parseInt(quantity) || 0
    });
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = new Product();
    
    // Check if product exists
    const existingProduct = await product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const deleted = await product.delete(id);
    if (deleted) {
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const product = new Product();
    const products = await product.search(q);
    
    // Parse JSON images for each product
    const productsWithParsedImages = products.map(product => {
      let images = [];
      try {
        if (product.images && typeof product.images === 'string') {
          images = JSON.parse(product.images);
        } else if (Array.isArray(product.images)) {
          images = product.images;
        }
      } catch (error) {
        console.warn('Error parsing images for product:', product.id, error.message);
        images = [];
      }
      
      return {
        ...product,
        images: images
      };
    });
    
    res.json(productsWithParsedImages);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
};

const getProductsByPriceRange = async (req, res) => {
  try {
    const { min, max } = req.query;
    
    if (!min || !max) {
      return res.status(400).json({ error: 'Min and max price are required' });
    }
    
    const product = new Product();
    const products = await product.findByPriceRange(parseFloat(min), parseFloat(max));
    
    // Parse JSON images for each product
    const productsWithParsedImages = products.map(product => {
      let images = [];
      try {
        if (product.images && typeof product.images === 'string') {
          images = JSON.parse(product.images);
        } else if (Array.isArray(product.images)) {
          images = product.images;
        }
      } catch (error) {
        console.warn('Error parsing images for product:', product.id, error.message);
        images = [];
      }
      
      return {
        ...product,
        images: images
      };
    });
    
    res.json(productsWithParsedImages);
  } catch (error) {
    console.error('Error fetching products by price range:', error);
    res.status(500).json({ error: 'Failed to fetch products by price range' });
  }
};

const updateProductQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }
    
    const product = new Product();
    
    // Check if product exists
    const existingProduct = await product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await product.updateQuantity(id, parseInt(quantity));
    res.json({ message: 'Product quantity updated successfully' });
  } catch (error) {
    console.error('Error updating product quantity:', error);
    res.status(500).json({ error: 'Failed to update product quantity' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByPriceRange,
  updateProductQuantity
};
