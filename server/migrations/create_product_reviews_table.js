async function createProductReviewsTable(connection) {
    try {
        console.log('Creating product_reviews table...');

        // Check if table already exists
        const [tables] = await connection.execute(
            `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'product_reviews'`
        );

        if (tables.length === 0) {
            await connection.execute(`
        CREATE TABLE IF NOT EXISTS product_reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          order_id INT,
          rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
          review_text TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
          UNIQUE KEY unique_user_product_order (user_id, product_id, order_id)
        )
      `);
            console.log('✅ Product reviews table created successfully!');
        } else {
            console.log('✅ Product reviews table already exists.');
        }
    } catch (error) {
        console.error('❌ Error creating product_reviews table:', error);
        throw error;
    }
}

module.exports = createProductReviewsTable;

