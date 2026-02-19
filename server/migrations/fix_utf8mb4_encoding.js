async function fixUtf8mb4Encoding(connection) {
    try {
        console.log('Fixing UTF8MB4 encoding for products table...');

        // Get the current database name
        const [dbResult] = await connection.execute('SELECT DATABASE() as db');
        const dbName = dbResult[0].db;

        // First, ensure the database uses utf8mb4 (use query instead of execute for DDL)
        if (dbName) {
            await connection.query(`ALTER DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        }

        // Convert description column to utf8mb4 (use query for ALTER TABLE as well)
        await connection.query(`
      ALTER TABLE products 
      MODIFY COLUMN description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

        // Convert specifications column to utf8mb4 if it exists
        const [specColumns] = await connection.execute(
            `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'products' 
       AND COLUMN_NAME = 'specifications'`
        );

        if (specColumns.length > 0) {
            await connection.query(`
        ALTER TABLE products 
        MODIFY COLUMN specifications TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `);
        }

        // Convert name column to utf8mb4 as well
        await connection.query(`
      ALTER TABLE products 
      MODIFY COLUMN name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
    `);

        console.log('✅ UTF8MB4 encoding fixed successfully!');
    } catch (error) {
        console.error('❌ Error fixing UTF8MB4 encoding:', error);
        throw error;
    }
}

module.exports = fixUtf8mb4Encoding;

