async function addVariantPricesToProducts(connection) {
    try {
        console.log('Adding variant_prices column to products table...');

        // Check if column already exists
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'products' 
       AND COLUMN_NAME = 'variant_prices'`
        );

        if (columns.length === 0) {
            await connection.execute(
                `ALTER TABLE products 
         ADD COLUMN variant_prices JSON NULL AFTER weight_variant`
            );
            console.log('✅ Variant prices column added successfully!');
        } else {
            console.log('✅ Variant prices column already exists.');
        }
    } catch (error) {
        console.error('❌ Error adding variant_prices column:', error);
        throw error;
    }
}

module.exports = addVariantPricesToProducts;

