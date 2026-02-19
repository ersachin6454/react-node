const { pool } = require('../config/database');

async function addMobileToUsers() {
    try {
        console.log('Adding mobile_number column to users table...');

        await pool.execute(`
      ALTER TABLE users 
      ADD COLUMN mobile_number VARCHAR(20) DEFAULT NULL AFTER email
    `);

        console.log('✅ Mobile number column added to users table successfully!');

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('✅ Mobile number column already exists in users table.');
        } else {
            console.error('❌ Error adding mobile number column:', error);
        }
    } finally {
        process.exit();
    }
}

addMobileToUsers();

