const Order = require('../models/Order');
const Product = require('../models/Product');

// Create new order
const createOrder = async (req, res) => {
  const { userId, items, billingInfo, paymentMethod, cardInfo, total } = req.body;
  
  try {
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'User ID and items are required' });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ error: 'Valid total amount is required' });
    }

    console.log('Creating order with data:', { userId, items, total, billingInfo });
    
    // Fetch product details to get correct prices
    const product = new Product();
    const productPromises = items.map(item => 
      product.findById(item.productId)
    );
    const products = await Promise.all(productPromises);
    
    console.log('Fetched products:', products);
    
    // Prepare items with correct prices
    const orderItems = items.map((item, index) => {
      const product = products[index];
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
      return {
        product_id: item.productId,
        quantity: item.quantity,
        price: product.sell_price || product.price
      };
    });
    
    console.log('Prepared order items:', orderItems);

    const order = new Order();
    
    // Prepare order data for the model
    const orderData = {
      user_id: userId,
      stripe_payment_intent_id: null, // Will be updated when payment is processed
      total_amount: total,
      shipping_address: billingInfo, // Using billing info as shipping address
      billing_address: billingInfo,
      items: orderItems
    };

    const newOrder = await order.create(orderData);

    res.status(201).json({ 
      message: 'Order created successfully', 
      order: newOrder 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId,
      items,
      total
    });
    res.status(500).json({ 
      error: 'Failed to create order',
      details: error.message 
    });
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const order = new Order();
    const orders = await order.getUserOrders(userId);

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = new Order();
    const orderData = await order.findById(orderId);

    if (!orderData) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(orderData);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Get all orders (admin)
const getAllOrders = async (req, res) => {
  try {
    const order = new Order();
    const orders = await order.getAllOrders();

    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Update order status (admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = new Order();
    await order.updateStatus(orderId, status);

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};
