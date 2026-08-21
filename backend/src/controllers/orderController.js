const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { recordInteraction } = require('../services/interactionService');

// @desc    Create new order & automatically record purchase interactions
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod = 'credit_card' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required.',
      });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address is required.',
      });
    }

    // Verify products, compute server-side totals, update stock
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Available: ${product.stock}`,
        });
      }

      // Decrement stock
      product.stock -= item.quantity;
      await product.save();

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || '',
      });
    }

    // Taxes & Shipping calculations
    const tax = Number((subtotal * 0.08).toFixed(2)); // 8% sales tax
    const shippingFee = subtotal >= 50 ? 0 : 5.99; // Complimentary shipping over $50
    const totalAmount = Number((subtotal + tax + shippingFee).toFixed(2));

    // Create Order
    const order = await Order.create({
      userId: req.user._id,
      items: validatedItems,
      subtotal,
      tax,
      shippingFee,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'completed',
      status: 'Processing',
    });

    // Clear user's Cart in MongoDB after order creation
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });

    // Automatically record purchase interactions (weight = 5.0) for ML training
    for (const item of validatedItems) {
      try {
        await recordInteraction({
          userId: req.user._id,
          productId: item.productId,
          type: 'purchase',
          metadata: { orderId: order._id.toString() },
        });
      } catch (interactionErr) {
        console.warn(`Failed to record purchase interaction: ${interactionErr.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Verify ownership or admin role
    if (
      order.userId._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order.',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
};
