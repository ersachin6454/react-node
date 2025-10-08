const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { connectDB } = require('./config/database');

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/items', require('./routes/items'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));

// Database health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const { pool } = require('./config/database');
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT 1 as status, NOW() as timestamp');
    connection.release();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: rows[0].timestamp,
      message: 'Database connection is working'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      message: 'Database connection failed'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
