const { pool, connectDB } = require('./config/database');
require('dotenv').config();

const testDatabaseConnection = async () => {
  console.log('Testing database connection...');
  console.log('Database configuration:');
  console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`User: ${process.env.DB_USER || 'root'}`);
  console.log(`Database: ${process.env.DB_NAME || 'test'}`);
  console.log('---');

  try {
    // Test basic connection
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database query test successful:', rows[0]);
    
    // Check if database exists and show tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Available tables:');
    if (tables.length === 0) {
      console.log('   No tables found');
    } else {
      tables.forEach(table => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
    }
    
    // Check database version
    const [version] = await connection.execute('SELECT VERSION() as version');
    console.log(`🔧 MySQL Version: ${version[0].version}`);
    
    connection.release();
    console.log('✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Possible solutions:');
      console.error('1. Make sure MySQL/MAMP is running');
      console.error('2. Check if the port is correct (usually 3306 for MySQL, 8889 for MAMP)');
      console.error('3. Verify your .env file has correct database credentials');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Possible solutions:');
      console.error('1. Check your database username and password in .env file');
      console.error('2. Make sure the user has proper permissions');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Possible solutions:');
      console.error('1. The database does not exist - run migrations first');
      console.error('2. Check the database name in your .env file');
    }
    
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
};

// Run the test
testDatabaseConnection();
