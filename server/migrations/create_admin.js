const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function createAdmin() {
  try {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin User';

    // Check if admin already exists
    const [existingAdmin] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND role = "admin"',
      [adminEmail]
    );

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists with email:', adminEmail);
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, confirm_password, role) VALUES (?, ?, ?, ?, "admin")',
      [adminName, adminEmail, hashedPassword, hashedPassword]
    );

    console.log('Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Admin ID:', result.insertId);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit();
  }
}

createAdmin();
