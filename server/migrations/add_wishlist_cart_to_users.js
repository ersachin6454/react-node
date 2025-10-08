async function addWishlistCartToUsers(connection) {
  try {
    console.log('Adding wishlist and cart_item columns to users table...');

    // Add wishlist column (JSON array of product IDs)
    const addWishlistQuery = `
      ALTER TABLE users 
      ADD COLUMN wishlist JSON
    `;

    // Add cart_item column (JSON array of objects with product_id and quantity)
    const addCartItemQuery = `
      ALTER TABLE users 
      ADD COLUMN cart_item JSON
    `;

    await connection.execute(addWishlistQuery);
    console.log('✅ Wishlist column added successfully!');

    await connection.execute(addCartItemQuery);
    console.log('✅ Cart item column added successfully!');

  } catch (error) {
    console.error('❌ Error adding columns to users table:', error);
    throw error;
  }
}

module.exports = addWishlistCartToUsers;
