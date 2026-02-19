async function addWeightVariantToProducts(connection) {
    try {
        console.log('Adding weight_variant column to products table...');

        // Check if column already exists
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'products' 
       AND COLUMN_NAME = 'weight_variant'`
        );

        if (columns.length === 0) {
            await connection.execute(
                `ALTER TABLE products 
         ADD COLUMN weight_variant VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '400 gram' AFTER quantity`
            );
            console.log('✅ Weight variant column added successfully!');
        } else {
            console.log('✅ Weight variant column already exists.');
        }
    } catch (error) {
        console.error('❌ Error adding weight_variant column:', error);
        throw error;
    }
}

module.exports = addWeightVariantToProducts;

