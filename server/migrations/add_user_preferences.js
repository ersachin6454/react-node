const { pool } = require('../config/database');

async function addUserPreferences() {
  try {
    console.log('Adding user preferences columns to users table...');

    // Add saved_address column (JSON object with address information)
    const addSavedAddressQuery = `
      ALTER TABLE users 
      ADD COLUMN saved_address JSON
    `;

    // Add saved_payment_info column (JSON object with payment preferences)
    const addSavedPaymentQuery = `
      ALTER TABLE users 
      ADD COLUMN saved_payment_info JSON
    `;

    await pool.execute(addSavedAddressQuery);
    console.log('✅ Saved address column added successfully!');

    await pool.execute(addSavedPaymentQuery);
    console.log('✅ Saved payment info column added successfully!');

  } catch (error) {
    console.error('❌ Error adding user preferences columns:', error);
    throw error;
  } finally {
    process.exit();
  }
}

addUserPreferences();
