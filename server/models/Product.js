const { pool } = require('../config/database');

class Product {

  async findAll(includeInactive = false) {
    try {
      let query = 'SELECT * FROM products';
      if (!includeInactive) {
        query += ' WHERE is_active = TRUE';
      }
      query += ' ORDER BY created_at DESC';
      const [rows] = await pool.execute(query);
      // Parse variant_prices for each product
      return rows.map(row => {
        if (row.variant_prices) {
          try {
            row.variant_prices = typeof row.variant_prices === 'string'
              ? JSON.parse(row.variant_prices)
              : row.variant_prices;
          } catch (e) {
            row.variant_prices = null;
          }
        }
        return row;
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
      if (rows[0]) {
        // Parse variant_prices if it exists
        if (rows[0].variant_prices) {
          try {
            rows[0].variant_prices = typeof rows[0].variant_prices === 'string'
              ? JSON.parse(rows[0].variant_prices)
              : rows[0].variant_prices;
          } catch (e) {
            rows[0].variant_prices = null;
          }
        }
        return rows[0];
      }
      return null;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  }

  async create(productData) {
    try {
      const { name, price, sell_price, description, images, quantity, specifications, is_active, weight_variant, variant_prices } = productData;

      // Check if columns exist
      const [columns] = await pool.execute(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'products' 
         AND COLUMN_NAME IN ('is_active', 'weight_variant', 'variant_prices')`
      );

      const hasIsActiveColumn = columns.some(col => col.COLUMN_NAME === 'is_active');
      const hasWeightVariantColumn = columns.some(col => col.COLUMN_NAME === 'weight_variant');
      const hasVariantPricesColumn = columns.some(col => col.COLUMN_NAME === 'variant_prices');

      // Prepare variant_prices JSON
      let variantPricesJson = null;
      if (variant_prices && typeof variant_prices === 'object') {
        variantPricesJson = JSON.stringify(variant_prices);
      } else if (variant_prices && typeof variant_prices === 'string') {
        try {
          JSON.parse(variant_prices);
          variantPricesJson = variant_prices;
        } catch (e) {
          variantPricesJson = null;
        }
      }

      if (hasIsActiveColumn && hasWeightVariantColumn && hasVariantPricesColumn) {
        const [result] = await pool.execute(
          'INSERT INTO products (name, price, sell_price, description, images, quantity, weight_variant, variant_prices, specifications, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [name, price, sell_price, description, JSON.stringify(images), quantity, weight_variant || '800 gram', variantPricesJson, specifications || null, is_active !== undefined ? is_active : true]
        );
        return { id: result.insertId, ...productData };
      } else if (hasIsActiveColumn && hasWeightVariantColumn) {
        const [result] = await pool.execute(
          'INSERT INTO products (name, price, sell_price, description, images, quantity, weight_variant, specifications, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [name, price, sell_price, description, JSON.stringify(images), quantity, weight_variant || '800 gram', specifications || null, is_active !== undefined ? is_active : true]
        );
        return { id: result.insertId, ...productData };
      } else if (hasIsActiveColumn) {
        const [result] = await pool.execute(
          'INSERT INTO products (name, price, sell_price, description, images, quantity, specifications, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [name, price, sell_price, description, JSON.stringify(images), quantity, specifications || null, is_active !== undefined ? is_active : true]
        );
        return { id: result.insertId, ...productData };
      } else {
        const [result] = await pool.execute(
          'INSERT INTO products (name, price, sell_price, description, images, quantity, specifications) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [name, price, sell_price, description, JSON.stringify(images), quantity, specifications || null]
        );
        return { id: result.insertId, ...productData };
      }
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async update(id, productData) {
    try {
      const { name, price, sell_price, description, images, quantity, specifications, is_active, weight_variant, variant_prices } = productData;

      // Validate required fields
      if (!name || !price || !sell_price) {
        throw new Error('Name, price, and sell_price are required');
      }

      // Ensure images is an array and stringify it
      let imagesJson = '[]';
      if (images) {
        if (Array.isArray(images)) {
          imagesJson = JSON.stringify(images);
        } else if (typeof images === 'string') {
          // Already a JSON string, validate it
          try {
            JSON.parse(images);
            imagesJson = images;
          } catch (e) {
            imagesJson = JSON.stringify([images]);
          }
        } else {
          imagesJson = JSON.stringify([]);
        }
      }

      // Prepare variant_prices JSON
      let variantPricesJson = null;
      if (variant_prices && typeof variant_prices === 'object') {
        variantPricesJson = JSON.stringify(variant_prices);
      } else if (variant_prices && typeof variant_prices === 'string') {
        try {
          JSON.parse(variant_prices);
          variantPricesJson = variant_prices;
        } catch (e) {
          variantPricesJson = null;
        }
      }

      // Check if columns exist
      const [columns] = await pool.execute(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'products' 
         AND COLUMN_NAME IN ('is_active', 'weight_variant', 'variant_prices')`
      );

      const hasIsActiveColumn = columns.some(col => col.COLUMN_NAME === 'is_active');
      const hasWeightVariantColumn = columns.some(col => col.COLUMN_NAME === 'weight_variant');
      const hasVariantPricesColumn = columns.some(col => col.COLUMN_NAME === 'variant_prices');

      if (hasIsActiveColumn && hasWeightVariantColumn && hasVariantPricesColumn) {
        const [result] = await pool.execute(
          'UPDATE products SET name = ?, price = ?, sell_price = ?, description = ?, images = ?, quantity = ?, weight_variant = ?, variant_prices = ?, specifications = ?, is_active = ? WHERE id = ?',
          [
            name,
            parseFloat(price),
            parseFloat(sell_price),
            description || '',
            imagesJson,
            parseInt(quantity) || 0,
            weight_variant || '800 gram',
            variantPricesJson,
            specifications || null,
            is_active !== undefined ? (is_active === true || is_active === 'true' || is_active === 1) : true,
            parseInt(id)
          ]
        );

        if (result.affectedRows === 0) {
          throw new Error('Product not found or no changes made');
        }
      } else if (hasIsActiveColumn && hasWeightVariantColumn) {
        const [result] = await pool.execute(
          'UPDATE products SET name = ?, price = ?, sell_price = ?, description = ?, images = ?, quantity = ?, weight_variant = ?, specifications = ?, is_active = ? WHERE id = ?',
          [
            name,
            parseFloat(price),
            parseFloat(sell_price),
            description || '',
            imagesJson,
            parseInt(quantity) || 0,
            weight_variant || '800 gram',
            specifications || null,
            is_active !== undefined ? (is_active === true || is_active === 'true' || is_active === 1) : true,
            parseInt(id)
          ]
        );

        if (result.affectedRows === 0) {
          throw new Error('Product not found or no changes made');
        }
      } else if (hasIsActiveColumn) {
        const [result] = await pool.execute(
          'UPDATE products SET name = ?, price = ?, sell_price = ?, description = ?, images = ?, quantity = ?, specifications = ?, is_active = ? WHERE id = ?',
          [
            name,
            parseFloat(price),
            parseFloat(sell_price),
            description || '',
            imagesJson,
            parseInt(quantity) || 0,
            specifications || null,
            is_active !== undefined ? (is_active === true || is_active === 'true' || is_active === 1) : true,
            parseInt(id)
          ]
        );

        if (result.affectedRows === 0) {
          throw new Error('Product not found or no changes made');
        }
      } else {
        const [result] = await pool.execute(
          'UPDATE products SET name = ?, price = ?, sell_price = ?, description = ?, images = ?, quantity = ?, specifications = ? WHERE id = ?',
          [
            name,
            parseFloat(price),
            parseFloat(sell_price),
            description || '',
            imagesJson,
            parseInt(quantity) || 0,
            specifications || null,
            parseInt(id)
          ]
        );

        if (result.affectedRows === 0) {
          throw new Error('Product not found or no changes made');
        }
      }

      // Fetch and return the updated product
      const updatedProduct = await this.findById(id);
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product in model:', error);
      console.error('Product data:', productData);
      throw error;
    }
  }

  async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  async search(searchTerm) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY created_at DESC',
        [`%${searchTerm}%`, `%${searchTerm}%`]
      );
      return rows;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  async findByPriceRange(minPrice, maxPrice) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM products WHERE sell_price BETWEEN ? AND ? ORDER BY sell_price ASC',
        [minPrice, maxPrice]
      );
      return rows;
    } catch (error) {
      console.error('Error fetching products by price range:', error);
      throw error;
    }
  }

  async updateQuantity(id, newQuantity) {
    try {
      await pool.execute(
        'UPDATE products SET quantity = ? WHERE id = ?',
        [newQuantity, id]
      );
      return true;
    } catch (error) {
      console.error('Error updating product quantity:', error);
      throw error;
    }
  }

  async toggleActive(id, isActive) {
    try {
      // Check if is_active column exists
      const [columns] = await pool.execute(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'products' 
         AND COLUMN_NAME = 'is_active'`
      );

      if (columns.length === 0) {
        throw new Error('is_active column does not exist. Please run the migration first.');
      }

      await pool.execute(
        'UPDATE products SET is_active = ? WHERE id = ?',
        [isActive, id]
      );
      return true;
    } catch (error) {
      console.error('Error toggling product active status:', error);
      throw error;
    }
  }
}

module.exports = Product;
