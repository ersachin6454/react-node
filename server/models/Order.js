const { pool } = require('../config/database');

class Order {
  // Create new order
  async create(orderData) {
    try {
      console.log('Order.create called with:', orderData);

      const {
        user_id,
        stripe_payment_intent_id,
        total_amount,
        shipping_address,
        billing_address,
        items,
        status = 'pending'
      } = orderData;

      console.log('Parsed order data:', {
        user_id,
        stripe_payment_intent_id,
        total_amount,
        shipping_address,
        billing_address,
        items,
        status
      });

      // Start transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        console.log('Creating order in database...');
        // Create order
        const [orderResult] = await connection.execute(
          `INSERT INTO orders (
            user_id, 
            stripe_payment_intent_id, 
            total_amount, 
            shipping_address, 
            billing_address, 
            status
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            stripe_payment_intent_id,
            total_amount,
            JSON.stringify(shipping_address),
            JSON.stringify(billing_address),
            status
          ]
        );

        const orderId = orderResult.insertId;
        console.log('Order created with ID:', orderId);

        // Add order items
        console.log('Adding order items:', items);
        for (const item of items) {
          console.log('Adding item:', item);
          await connection.execute(
            `INSERT INTO order_items (
              order_id, 
              product_id, 
              quantity, 
              price
            ) VALUES (?, ?, ?, ?)`,
            [orderId, item.product_id, item.quantity, item.price]
          );
        }
        console.log('All order items added successfully');

        await connection.commit();
        return { id: orderId, ...orderData };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Get order by ID
  async findById(orderId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          o.*,
          u.name as user_name,
          u.email as user_email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `, [orderId]);

      if (rows.length === 0) {
        return null;
      }

      const order = rows[0];

      // Parse addresses
      order.shipping_address = JSON.parse(order.shipping_address);
      order.billing_address = JSON.parse(order.billing_address);

      // Get order items
      const [items] = await pool.execute(`
        SELECT 
          oi.*,
          p.name as product_name,
          p.images
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [orderId]);

      order.items = items.map(item => ({
        ...item,
        images: JSON.parse(item.images || '[]')
      }));

      return order;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  // Get user's orders
  async getUserOrders(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          o.id,
          o.total_amount,
          o.status,
          o.created_at,
          o.stripe_payment_intent_id
        FROM orders o
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
      `, [userId]);

      // Get order items for each order
      const ordersWithItems = await Promise.all(rows.map(async (order) => {
        const [items] = await pool.execute(`
          SELECT 
            oi.*,
            p.name as product_name,
            p.images,
            p.sell_price
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `, [order.id]);

        order.items = items.map(item => {
          let images = [];
          try {
            if (item.images && typeof item.images === 'string') {
              images = JSON.parse(item.images);
            } else if (Array.isArray(item.images)) {
              images = item.images;
            }
          } catch (error) {
            console.error('Error parsing images for order item:', error);
            images = [];
          }

          return {
            ...item,
            images: images
          };
        });

        return order;
      }));

      return ordersWithItems;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }

  // Get all orders (admin)
  async getAllOrders() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          o.id,
          o.total_amount,
          o.status,
          o.created_at,
          o.stripe_payment_intent_id,
          u.name as user_name,
          u.email as user_email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `);

      return rows;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  }

  // Update order status
  async updateStatus(orderId, status) {
    try {
      await pool.execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, orderId]
      );

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Update order with Stripe payment intent
  async updateWithPaymentIntent(orderId, paymentIntentId, status = 'paid') {
    try {
      await pool.execute(
        'UPDATE orders SET stripe_payment_intent_id = ?, status = ? WHERE id = ?',
        [paymentIntentId, status, orderId]
      );

      return true;
    } catch (error) {
      console.error('Error updating order with payment intent:', error);
      throw error;
    }
  }
}

module.exports = Order;
