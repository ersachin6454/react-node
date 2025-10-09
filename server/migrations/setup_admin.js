const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupAdmin() {
  try {
    console.log('🔐 Admin Setup - Secure Configuration');
    console.log('=====================================\n');

    // Get admin details from user
    const name = await askQuestion('Enter admin full name: ');
    const email = await askQuestion('Enter admin email: ');
    const password = await askQuestion('Enter admin password (min 6 characters): ');

    if (!name || !email || !password) {
      console.log('❌ All fields are required!');
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters long!');
      process.exit(1);
    }

    // Check if admin already exists
    const [existingAdmin] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND role = "admin"',
      [email]
    );

    if (existingAdmin.length > 0) {
      console.log('❌ Admin with this email already exists!');
      process.exit(1);
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user
    console.log('👤 Creating admin user...');
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, confirm_password, role) VALUES (?, ?, ?, ?, "admin")',
      [name, email, hashedPassword, hashedPassword]
    );

    console.log('\n✅ Admin user created successfully!');
    console.log('=====================================');
    console.log(`Admin ID: ${result.insertId}`);
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Role: admin`);
    console.log('\n🔐 You can now login to the admin dashboard!');
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error.message);
  } finally {
    rl.close();
    process.exit();
  }
}

// Check if role column exists, if not add it
async function ensureRoleColumn() {
  try {
    await pool.execute(`
      ALTER TABLE users 
      ADD COLUMN role VARCHAR(20) DEFAULT 'user' AFTER password
    `);
    console.log('✅ Role column added to users table');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Role column already exists');
    } else {
      throw error;
    }
  }
}

async function main() {
  try {
    await ensureRoleColumn();
    await setupAdmin();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
