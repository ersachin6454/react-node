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
      return rows;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  }

  async create(productData) {
    try {
      const { name, price, sell_price, description, images, quantity, specifications, is_active } = productData;

      // Check if is_active column exists
      const [columns] = await pool.execute(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'products' 
         AND COLUMN_NAME = 'is_active'`
      );

      const hasIsActiveColumn = columns.length > 0;

      if (hasIsActiveColumn) {
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
      const { name, price, sell_price, description, images, quantity, specifications, is_active } = productData;

      // Check if is_active column exists
      const [columns] = await pool.execute(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'products' 
         AND COLUMN_NAME = 'is_active'`
      );

      const hasIsActiveColumn = columns.length > 0;

      if (hasIsActiveColumn) {
        await pool.execute(
          'UPDATE products SET name = ?, price = ?, sell_price = ?, description = ?, images = ?, quantity = ?, specifications = ?, is_active = ? WHERE id = ?',
          [name, price, sell_price, description, JSON.stringify(images), quantity, specifications || null, is_active !== undefined ? is_active : true, id]
        );
      } else {
        await pool.execute(
          'UPDATE products SET name = ?, price = ?, sell_price = ?, description = ?, images = ?, quantity = ?, specifications = ? WHERE id = ?',
          [name, price, sell_price, description, JSON.stringify(images), quantity, specifications || null, id]
        );
      }

      return { id, ...productData };
    } catch (error) {
      console.error('Error updating product:', error);
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
