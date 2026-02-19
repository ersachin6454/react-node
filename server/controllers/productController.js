const Product = require('../models/Product');

const getAllProducts = async (req, res) => {
  try {
    const product = new Product();
    // Admin routes can see all products, public routes only see active products
    const includeInactive = req.originalUrl.includes('/admin/');
    const products = await product.findAll(includeInactive);

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

    // For public routes, only return active products (if is_active column exists)
    const isAdminRoute = req.originalUrl.includes('/admin/');
    if (!isAdminRoute && productData.is_active !== undefined && productData.is_active === false) {
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
    const { name, price, sell_price, description, images, quantity, specifications, is_active, weight_variant, variant_prices } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    // Calculate default price and sell_price from variant_prices if not provided
    let defaultPrice = price ? parseFloat(price) : 0;
    let defaultSellPrice = sell_price ? parseFloat(sell_price) : 0;
    let defaultWeightVariant = weight_variant || '400 gram';

    if (variant_prices) {
      // Use first available variant as default
      const variants = ['400 gram', '800 gram', '1.2kg'];
      for (const variant of variants) {
        if (variant_prices[variant] && variant_prices[variant].price) {
          defaultPrice = parseFloat(variant_prices[variant].price) || 0;
          defaultSellPrice = parseFloat(variant_prices[variant].sell_price) || 0;
          defaultWeightVariant = variant;
          break;
        }
      }
    }

    const product = new Product();
    const newProduct = await product.create({
      name,
      price: defaultPrice,
      sell_price: defaultSellPrice,
      description: description || '',
      images: images || [],
      quantity: parseInt(quantity) || 0,
      weight_variant: defaultWeightVariant,
      variant_prices: variant_prices || null,
      specifications: specifications || null,
      is_active: is_active !== undefined ? is_active : true
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
    const { name, price, sell_price, description, images, quantity, specifications, is_active, weight_variant, variant_prices } = req.body;

    // Basic validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const product = new Product();

    // Check if product exists
    const existingProduct = await product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate default price and sell_price from variant_prices if not provided
    let defaultPrice = price ? parseFloat(price) : (existingProduct.price || 0);
    let defaultSellPrice = sell_price ? parseFloat(sell_price) : (existingProduct.sell_price || 0);
    let defaultWeightVariant = weight_variant || existingProduct.weight_variant || '400 gram';

    if (variant_prices) {
      // Use first available variant as default
      const variants = ['400 gram', '800 gram', '1.2kg'];
      for (const variant of variants) {
        if (variant_prices[variant] && variant_prices[variant].price) {
          defaultPrice = parseFloat(variant_prices[variant].price) || 0;
          defaultSellPrice = parseFloat(variant_prices[variant].sell_price) || 0;
          defaultWeightVariant = variant;
          break;
        }
      }
    }

    // Ensure images is an array
    let imagesArray = [];
    if (images) {
      if (Array.isArray(images)) {
        imagesArray = images;
      } else if (typeof images === 'string') {
        try {
          imagesArray = JSON.parse(images);
        } catch (e) {
          imagesArray = [images];
        }
      } else {
        imagesArray = [];
      }
    }

    const updatedProduct = await product.update(id, {
      name: name.trim(),
      price: defaultPrice,
      sell_price: defaultSellPrice,
      description: description || '',
      images: imagesArray,
      quantity: quantity !== undefined && quantity !== null && quantity !== '' ? parseInt(quantity) : 0,
      weight_variant: defaultWeightVariant,
      variant_prices: variant_prices || existingProduct.variant_prices || null,
      specifications: specifications || null,
      is_active: is_active !== undefined ? (is_active === true || is_active === 'true' || is_active === 1) : existingProduct.is_active
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({
      error: 'Failed to update product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    // For public search, only show active products (if is_active column exists)
    const allProducts = await product.search(q);
    const products = allProducts.filter(p => p.is_active === undefined || p.is_active !== false);

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
    // For public routes, only show active products (if is_active column exists)
    const allProducts = await product.findByPriceRange(parseFloat(min), parseFloat(max));
    const products = allProducts.filter(p => p.is_active === undefined || p.is_active !== false);

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

const toggleProductActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({ error: 'is_active is required' });
    }

    const product = new Product();

    // Check if product exists
    const existingProduct = await product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.toggleActive(id, is_active);
    res.json({ message: 'Product status updated successfully', is_active });
  } catch (error) {
    console.error('Error toggling product active status:', error);
    res.status(500).json({ error: 'Failed to update product status' });
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
  updateProductQuantity,
  toggleProductActive
};
