const seedProducts = require('./productsSeeder');

async function runAllSeeders() {
  try {
    console.log('🌱 Starting database seeders...');
    
    await seedProducts();
    
    console.log('🎉 All seeders completed successfully!');
  } catch (error) {
    console.error('❌ Seeder error:', error);
    process.exit(1);
  }
}

runAllSeeders();
