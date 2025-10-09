const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if admin exists
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND role = "admin"',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email, 
        role: admin.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Create admin user (for initial setup)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if admin already exists
    const [existingAdmin] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND role = "admin"',
      [email]
    );

    if (existingAdmin.length > 0) {
      return res.status(400).json({ error: 'Admin with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "admin")',
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: result.insertId,
        name,
        email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Server error during admin creation' });
  }
};

// Get admin profile
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin.id;

    const [rows] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ? AND role = "admin"',
      [adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ error: 'Server error fetching admin profile' });
  }
};

module.exports = {
  adminLogin,
  createAdmin,
  getAdminProfile
};
