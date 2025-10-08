const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedProducts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 8886,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'react_node_project'
  });

  try {
    console.log('Seeding products...');

    // Check if products already exist
    const [existingProducts] = await connection.execute('SELECT COUNT(*) as count FROM products');
    if (existingProducts[0].count > 0) {
      console.log('⏭️  Products already exist, skipping seed');
      return;
    }

    const sampleProducts = [
      {
        name: 'Premium Wireless Headphones',
        price: 299.99,
        sell_price: 199.99,
        description: 'High-quality wireless headphones with noise cancellation and premium sound quality.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        ]),
        quantity: 50
      },
      {
        name: 'Smart Fitness Watch',
        price: 199.99,
        sell_price: 149.99,
        description: 'Advanced fitness tracking watch with heart rate monitor, GPS, and water resistance.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        ]),
        quantity: 30
      },
      {
        name: 'Professional Camera Lens',
        price: 899.99,
        sell_price: 699.99,
        description: 'Professional-grade camera lens with excellent optical quality and fast autofocus.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        ]),
        quantity: 15
      },
      {
        name: 'Gaming Mechanical Keyboard',
        price: 149.99,
        sell_price: 99.99,
        description: 'RGB mechanical keyboard designed for gaming with customizable lighting and tactile switches.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1541140532154-b024d705b90a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        ]),
        quantity: 25
      },
      {
        name: 'Wireless Bluetooth Speaker',
        price: 79.99,
        sell_price: 59.99,
        description: 'Portable wireless speaker with excellent sound quality and long battery life.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        ]),
        quantity: 40
      }
    ];

    for (const product of sampleProducts) {
      const insertQuery = `
        INSERT INTO products (name, price, sell_price, description, images, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(insertQuery, [
        product.name,
        product.price,
        product.sell_price,
        product.description,
        product.images,
        product.quantity
      ]);
    }

    console.log('✅ Sample products seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts;
