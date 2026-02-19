const { pool } = require('../config/database');

async function createShippingAddressesTable() {
    try {
        console.log('Creating shipping_addresses table...');

        await pool.execute(`
      CREATE TABLE IF NOT EXISTS shipping_addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(20) NOT NULL,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255) DEFAULT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL DEFAULT 'India',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_is_default (is_default)
      )
    `);

        console.log('✅ Shipping addresses table created successfully!');

    } catch (error) {
        console.error('❌ Error creating shipping_addresses table:', error);
    } finally {
        process.exit();
    }
}

createShippingAddressesTable();

