async function addIsActiveToProducts(connection) {
    try {
        console.log('Adding is_active column to products table...');

        // Check if column already exists
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'products' 
       AND COLUMN_NAME = 'is_active'`
        );

        if (columns.length === 0) {
            // Add is_active column with default true
            await connection.execute(
                `ALTER TABLE products 
         ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL`
            );

            // Update all existing products to be active
            await connection.execute(
                `UPDATE products SET is_active = TRUE WHERE is_active IS NULL`
            );

            console.log('✅ is_active column added successfully!');
        } else {
            console.log('✅ is_active column already exists!');
        }
    } catch (error) {
        console.error('❌ Error adding is_active column:', error);
        throw error;
    }
}

module.exports = addIsActiveToProducts;

