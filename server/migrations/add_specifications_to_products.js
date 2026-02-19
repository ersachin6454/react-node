async function addSpecificationsToProducts(connection) {
    try {
        console.log('Adding specifications column to products table...');

        // Check if column already exists
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'products' 
       AND COLUMN_NAME = 'specifications'`
        );

        if (columns.length === 0) {
            await connection.execute(
                `ALTER TABLE products 
         ADD COLUMN specifications TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER description`
            );
            console.log('✅ Specifications column added successfully!');
        } else {
            console.log('✅ Specifications column already exists.');
        }
    } catch (error) {
        console.error('❌ Error adding specifications column:', error);
        throw error;
    }
}

module.exports = addSpecificationsToProducts;

