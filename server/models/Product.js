const { pool } = require('../config/database');

class Product {

  async findAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM products ORDER BY created_at DESC');
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
      const { name, price, sell_price, description, images, quantity } = productData;
      
      const [result] = await pool.execute(
        'INSERT INTO products (name, price, sell_price, description, images, quantity) VALUES (?, ?, ?, ?, ?, ?)',
        [name, price, sell_price, description, JSON.stringify(images), quantity]
      );
      
      return { id: result.insertId, ...productData };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async update(id, productData) {
    try {
      const { name, price, sell_price, description, images, quantity } = productData;
      
      await pool.execute(
        'UPDATE products SET name = ?, price = ?, sell_price = ?, description = ?, images = ?, quantity = ? WHERE id = ?',
        [name, price, sell_price, description, JSON.stringify(images), quantity, id]
      );
      
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
}

module.exports = Product;
