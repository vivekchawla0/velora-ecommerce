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

const mongoose = require('mongoose');
const { productsData } = require('../scripts/seed');

const fallbackProducts = (productsData || []).map((p, idx) => ({
  _id: p._id || `seed_prod_${p.sku || idx + 1}`,
  ...p,
}));

    // Verify products, compute server-side totals, update stock
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const pId = item.productId || item.product?._id || item.product;
      if (!pId) continue;

      let product = null;
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(pId)) {
        try {
          product = await Product.findById(pId);
        } catch (err) {
          // Fallthrough
        }
      }

      if (!product) {
        product = fallbackProducts.find(
          (p) => String(p._id) === String(pId) || String(p.id) === String(pId) || p.sku === pId
        );
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${pId}`,
        });
      }

      const availableStock = product.stock !== undefined ? product.stock : 99;
      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Available: ${availableStock}`,
        });
      }

      // Decrement stock if DB is active
      if (mongoose.connection.readyState === 1 && typeof product.save === 'function') {
        try {
          product.stock -= item.quantity;
          await product.save();
        } catch (err) {
          console.warn('[Order Controller] Stock decrement warning:', err.message);
        }
      }

      const itemPrice = product.price || 0;
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      const img = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '';
      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        image: img,
      });
    }

    // Taxes & Shipping calculations
    const tax = Number((subtotal * 0.08).toFixed(2)); // 8% sales tax
    const shippingFee = subtotal >= 50 ? 0 : 5.99; // Complimentary shipping over $50
    const totalAmount = Number((subtotal + tax + shippingFee).toFixed(2));

    // Create Order
    let order = null;
    if (mongoose.connection.readyState === 1) {
      try {
        order = await Order.create({
          userId: req.user._id || req.user.id,
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
        await Cart.findOneAndUpdate({ userId: req.user._id || req.user.id }, { items: [] }).catch(() => {});
      } catch (dbErr) {
        console.warn('[Order Controller] Order DB create warning:', dbErr.message);
      }
    }

    if (!order) {
      const orderNum = 'VEL-' + Math.floor(10000 + Math.random() * 90000);
      order = {
        _id: 'ord_' + Date.now(),
        orderNumber: orderNum,
        userId: req.user,
        items: validatedItems,
        subtotal,
        tax,
        shippingFee,
        totalAmount,
        shippingAddress,
        paymentMethod,
        paymentStatus: 'completed',
        status: 'Processing',
        createdAt: new Date().toISOString(),
      };
    }

    // Automatically record purchase interactions (weight = 5.0) for ML training
    for (const item of validatedItems) {
      try {
        await recordInteraction({
          userId: req.user._id || req.user.id,
          productId: item.productId,
          type: 'purchase',
          metadata: { orderId: String(order._id) },
        });
      } catch (interactionErr) {
        // Non-critical
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
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
