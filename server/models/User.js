const { pool } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.confirm_password = data.confirm_password;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM users ORDER BY created_at DESC');
      return rows.map(row => new User(row));
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      if (rows.length === 0) {
        return null;
      }
      return new User(rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        return null;
      }
      return new User(rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch user by email: ${error.message}`);
    }
  }

  static async create(userData) {
    try {
      const { name, email, password, confirm_password } = userData;
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, confirm_password) VALUES (?, ?, ?, ?)',
        [name, email, password, confirm_password]
      );
      
      const newUser = await User.findById(result.insertId);
      return newUser;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  static async update(id, userData) {
    try {
      const { name, email, password, confirm_password } = userData;
      const [result] = await pool.execute(
        'UPDATE users SET name = ?, email = ?, password = ?, confirm_password = ? WHERE id = ?',
        [name, email, password, confirm_password, id]
      );
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return await User.findById(id);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = User;
