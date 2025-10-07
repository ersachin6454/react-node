const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 8886, // MAMP default port
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'react_node_project'
};

const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('Starting migrations...');
    
    // Create database if not exists
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'react_node_project'}`);
    await connection.query(`USE ${process.env.DB_NAME || 'react_node_project'}`);
    
    // Create migrations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of migration files
    const migrationFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.js') && file !== 'migrate.js')
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration files:`, migrationFiles);
    
    // Run each migration
    for (const file of migrationFiles) {
      const migrationName = file.replace('.js', '');
      
      // Check if migration already ran
      const [existing] = await connection.execute(
        'SELECT * FROM migrations WHERE name = ?',
        [migrationName]
      );
      
      if (existing.length > 0) {
        console.log(`⏭️  Skipping ${migrationName} (already executed)`);
        continue;
      }
      
      console.log(`🔄 Running migration: ${migrationName}`);
      
      try {
        // Import and run the migration
        const migration = require(path.join(__dirname, file));
        
        // If the migration exports a function, run it
        if (typeof migration === 'function') {
          await migration(connection);
        }
        
        // Record migration as executed
        await connection.execute(
          'INSERT INTO migrations (name) VALUES (?)',
          [migrationName]
        );
        
        console.log(`✅ Completed migration: ${migrationName}`);
        
      } catch (error) {
        console.error(`❌ Error in migration ${migrationName}:`, error.message);
        throw error;
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
};

runMigrations();
