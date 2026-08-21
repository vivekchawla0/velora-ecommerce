const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Interaction = require('../models/Interaction');
const RecommendationFeedback = require('../models/RecommendationFeedback');

// @desc    Get dashboard metrics & platform statistics including recommendation analytics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenueResult,
      topViewedAgg,
      topPurchasedAgg,
      recentOrders,
      ordersByStatus,
      recClicksCount,
      recImpressionsCount,
      dismissedAgg,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
      ]),
      Interaction.aggregate([
        { $match: { type: 'view' } },
        { $group: { _id: '$productId', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 5 },
      ]),
      Interaction.aggregate([
        { $match: { type: 'purchase' } },
        { $group: { _id: '$productId', purchases: { $sum: 1 } } },
        { $sort: { purchases: -1 } },
        { $limit: 5 },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email')
        .lean(),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Interaction.countDocuments({ type: 'click' }),
      Interaction.countDocuments({ type: 'view' }),
      RecommendationFeedback.aggregate([
        { $match: { type: 'not_interested' } },
        { $group: { _id: '$productId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Populate top viewed product details
    const viewedIds = topViewedAgg.map((v) => v._id);
    const viewedProds = await Product.find({ _id: { $in: viewedIds } }).lean();
    const viewedMap = new Map(viewedProds.map((p) => [p._id.toString(), p]));
    const mostViewedProducts = topViewedAgg
      .map((v) => ({
        product: viewedMap.get(v._id.toString()),
        views: v.views,
      }))
      .filter((v) => v.product);

    // Populate top purchased product details
    const purchasedIds = topPurchasedAgg.map((p) => p._id);
    const purchasedProds = await Product.find({ _id: { $in: purchasedIds } }).lean();
    const purchasedMap = new Map(purchasedProds.map((p) => [p._id.toString(), p]));
    const mostPurchasedProducts = topPurchasedAgg
      .map((p) => ({
        product: purchasedMap.get(p._id.toString()),
        purchases: p.purchases,
      }))
      .filter((p) => p.product);

    // Populate most dismissed products
    const dismissedIds = dismissedAgg.map((d) => d._id);
    const dismissedProds = await Product.find({ _id: { $in: dismissedIds } }).lean();
    const dismissedMap = new Map(dismissedProds.map((p) => [p._id.toString(), p]));
    const mostDismissedProducts = dismissedAgg
      .map((d) => ({
        product: dismissedMap.get(d._id.toString()),
        dismissals: d.count,
      }))
      .filter((d) => d.product);

    const statusCounts = {
      Processing: 0,
      Confirmed: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };
    ordersByStatus.forEach((s) => {
      if (statusCounts[s._id] !== undefined) {
        statusCounts[s._id] = s.count;
      }
    });

    const calculatedCTR =
      recImpressionsCount > 0
        ? Number(((recClicksCount / recImpressionsCount) * 100).toFixed(1))
        : 0.0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        conversionRate: totalUsers > 0 ? Number(((totalOrders / totalUsers) * 100).toFixed(1)) : 0,
        statusCounts,
        mostViewedProducts,
        mostPurchasedProducts,
        mostDismissedProducts,
        recentOrders,
        recommendationAnalytics: {
          impressions: recImpressionsCount,
          clicks: recClicksCount,
          ctr: calculatedCTR,
          totalDismissals: dismissedAgg.reduce((sum, d) => sum + d.count, 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      discountPercentage,
      category,
      brand,
      images,
      stock,
      tags,
      featured,
      specs,
    } = req.body;

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : Number(price),
      discountPercentage: discountPercentage ? Number(discountPercentage) : 0,
      category,
      brand,
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'],
      stock: Number(stock) || 50,
      tags: Array.isArray(tags) ? tags : [],
      featured: Boolean(featured),
      specs: specs || {},
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin view)
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      Order.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'.`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
};
