const { pool } = require('../config/database');

async function addRoleColumn() {
  try {
    // Add role column to users table
    await pool.execute(`
      ALTER TABLE users 
      ADD COLUMN role VARCHAR(20) DEFAULT 'user' AFTER password
    `);
    
    console.log('Role column added to users table successfully!');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Role column already exists in users table.');
    } else {
      console.error('Error adding role column:', error);
    }
  } finally {
    process.exit();
  }
}

addRoleColumn();
