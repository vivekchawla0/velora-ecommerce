const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const Review = require('../models/Review');
const Interaction = require('../models/Interaction');
const RecommendationFeedback = require('../models/RecommendationFeedback');
const AuditLog = require('../models/AuditLog');
const { getPersonalizedRecommendations } = require('../services/recommendationClient');

// @desc    Get aggregated user statistics for Admin dashboard
// @route   GET /api/admin/users/stats
// @access  Private/Admin
const getUserStats = async (req, res, next) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      adminUsers,
    ] = await Promise.all([
      User.countDocuments({ status: { $ne: 'deleted' } }),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'blocked' }),
      User.countDocuments({ status: { $ne: 'deleted' }, createdAt: { $gte: oneWeekAgo } }),
      User.countDocuments({ status: { $ne: 'deleted' }, createdAt: { $gte: oneMonthAgo } }),
      User.countDocuments({ role: 'admin', status: { $ne: 'deleted' } }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        blockedUsers,
        newUsersThisWeek,
        newUsersThisMonth,
        adminUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated, searchable, filterable, sortable list of users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { q, role, status, dateRange, sortBy = 'newest' } = req.query;

    const matchQuery = {};

    // Do not show soft-deleted users in normal list unless explicitly filtered
    if (status === 'deleted') {
      matchQuery.status = 'deleted';
    } else if (status && status !== 'all') {
      matchQuery.status = status;
    } else {
      matchQuery.status = { $ne: 'deleted' };
    }

    // Role filter
    if (role && role !== 'all') {
      matchQuery.role = role;
    }

    // Search query (Name or Email)
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      matchQuery.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      if (dateRange === 'today') {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        matchQuery.createdAt = { $gte: startOfDay };
      } else if (dateRange === 'week' || dateRange === 'this_week') {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        matchQuery.createdAt = { $gte: oneWeekAgo };
      } else if (dateRange === 'month' || dateRange === 'this_month') {
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        matchQuery.createdAt = { $gte: oneMonthAgo };
      }
    }

    // Sorting definition
    let sortStage = { createdAt: -1 };
    if (sortBy === 'oldest') sortStage = { createdAt: 1 };
    else if (sortBy === 'name_asc') sortStage = { name: 1 };
    else if (sortBy === 'name_desc') sortStage = { name: -1 };
    else if (sortBy === 'activity') sortStage = { lastActivityAt: -1 };
    else if (sortBy === 'orders') sortStage = { ordersCount: -1, createdAt: -1 };

    // Execute aggregation with order count lookup
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'userId',
          as: 'userOrders',
        },
      },
      {
        $addFields: {
          ordersCount: { $size: '$userOrders' },
        },
      },
      {
        $project: {
          userOrders: 0,
          password: 0,
        },
      },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit },
    ];

    const [users, totalCountResult] = await Promise.all([
      User.aggregate(pipeline),
      User.countDocuments(matchQuery),
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: totalCountResult,
        pages: Math.ceil(totalCountResult / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed user profile and aggregated platform metrics
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Aggregate real cross-system metrics for this user
    const [
      orders,
      wishlist,
      cart,
      reviewsCount,
      viewsCount,
      purchasesCount,
      dismissedCount,
    ] = await Promise.all([
      Order.find({ userId: user._id }).lean(),
      Wishlist.findOne({ userId: user._id }).populate('products', 'name price images stock brand').lean(),
      Cart.findOne({ userId: user._id }).lean(),
      Review.countDocuments({ userId: user._id }),
      Interaction.countDocuments({ userId: user._id, type: 'view' }),
      Interaction.countDocuments({ userId: user._id, type: 'purchase' }),
      RecommendationFeedback.countDocuments({ userId: user._id }),
    ]);

    const totalSpent = orders
      .filter((o) => o.paymentStatus === 'completed' || o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || 'active',
        avatar: user.avatar,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastActivityAt: user.lastActivityAt || user.updatedAt || user.createdAt,
      },
      stats: {
        ordersCount: orders.length,
        totalSpent: Number(totalSpent.toFixed(2)),
        wishlistCount: wishlist?.products?.length || 0,
        cartCount: cart?.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0,
        reviewsCount,
        viewsCount,
        purchasesCount,
        dismissedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's order history
// @route   GET /api/admin/users/:id/orders
// @access  Private/Admin
const getUserOrders = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orders = await Order.find({ userId: id }).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's wishlist
// @route   GET /api/admin/users/:id/wishlist
// @access  Private/Admin
const getUserWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wishlist = await Wishlist.findOne({ userId: id })
      .populate('products', 'name price originalPrice discountPercentage images brand category stock rating ratingCount')
      .lean();

    res.status(200).json({
      success: true,
      count: wishlist?.products?.length || 0,
      wishlist: wishlist?.products || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's current shopping cart (Read-Only)
// @route   GET /api/admin/users/:id/cart
// @access  Private/Admin
const getUserCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cart = await Cart.findOne({ userId: id })
      .populate('items.productId', 'name price images stock brand category')
      .lean();

    let subtotal = 0;
    let totalItems = 0;

    const items = cart?.items
      ? cart.items
          .filter((i) => i.productId)
          .map((i) => {
            const price = i.price || i.productId.price || 0;
            subtotal += price * i.quantity;
            totalItems += i.quantity;
            return {
              product: i.productId,
              quantity: i.quantity,
              price,
              itemTotal: Number((price * i.quantity).toFixed(2)),
            };
          })
      : [];

    res.status(200).json({
      success: true,
      cart: {
        items,
        totalItems,
        subtotal: Number(subtotal.toFixed(2)),
        updatedAt: cart?.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's chronological interaction activity and calculated Category Interests
// @route   GET /api/admin/users/:id/activity
// @access  Private/Admin
const getUserActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 50;

    const interactions = await Interaction.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('productId', 'name price images category brand')
      .lean();

    // Calculate Real Category Interests from Weighted Interaction Logs
    const categoryWeights = {};
    let totalWeightSum = 0;

    interactions.forEach((evt) => {
      const category = evt.productId?.category || 'General';
      const weight = evt.weight || (evt.type === 'purchase' ? 5.0 : evt.type === 'cart' ? 4.0 : evt.type === 'wishlist' ? 3.0 : evt.type === 'click' ? 2.0 : 1.0);

      if (!categoryWeights[category]) categoryWeights[category] = 0;
      categoryWeights[category] += weight;
      totalWeightSum += weight;
    });

    const topInterests = Object.entries(categoryWeights)
      .map(([category, score]) => ({
        category,
        score: Number(score.toFixed(1)),
        percentage: totalWeightSum > 0 ? Math.round((score / totalWeightSum) * 100) : 0,
      }))
      .sort((a, b) => b.score - a.score);

    res.status(200).json({
      success: true,
      count: interactions.length,
      totalWeightSum,
      topInterests,
      activity: interactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live personalized recommendations & feedback for a user
// @route   GET /api/admin/users/:id/recommendations
// @access  Private/Admin
const getUserRecommendations = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Get user's negative feedback
    const feedbacks = await RecommendationFeedback.find({ userId: id })
      .populate('productId', 'name price images category brand')
      .lean();

    const excludedFeedbackIds = feedbacks.map((f) => f.productId?._id?.toString() || f.productId?.toString());
    const userInteractions = await Interaction.find({ userId: id }).select('productId');
    const interactedIds = userInteractions
      .filter((i) => i.productId)
      .map((i) => i.productId.toString());

    const allExcluded = Array.from(new Set([...excludedFeedbackIds, ...interactedIds]));

    // 2. Fetch real personalized recommendations (excluding already interacted items)
    const recResult = await getPersonalizedRecommendations(id, 6, allExcluded);

    res.status(200).json({
      success: true,
      service: 'Velora Python ML Recommender Service',
      strategy: recResult.source,
      count: recResult.data.length,
      recommendations: recResult.data,
      feedback: {
        dismissedCount: feedbacks.length,
        dismissedItems: feedbacks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Block or Unblock a user
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'active' or 'blocked'.",
      });
    }

    // Prevent admin from blocking their own account
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot block their own account.',
      });
    }

    const user = await User.findById(id);
    if (!user || user.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const previousStatus = user.status;
    user.status = status;
    await user.save();

    // Log Administrative Audit Trail
    await AuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: status === 'blocked' ? 'block_user' : 'unblock_user',
      targetUserId: user._id,
      targetUserEmail: user.email,
      details: `Admin changed status of ${user.name} (${user.email}) from '${previousStatus}' to '${status}'.`,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been ${status === 'blocked' ? 'blocked' : 'unblocked'}.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user role (user <-> admin)
// @route   PATCH /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'user' or 'admin'.",
      });
    }

    // Prevent admin from demoting themselves
    if (id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot remove their own admin privileges.',
      });
    }

    const user = await User.findById(id);
    if (!user || user.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    // Log Administrative Audit Trail
    await AuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: 'change_role',
      targetUserId: user._id,
      targetUserEmail: user.email,
      details: `Admin changed role of ${user.name} (${user.email}) from '${previousRole}' to '${role}'.`,
    });

    res.status(200).json({
      success: true,
      message: `Role for ${user.name} updated to '${role}'.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete a user account (preserves historical order/review data)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot delete their own account.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.status = 'deleted';
    await user.save();

    // Log Administrative Audit Trail
    await AuditLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: 'soft_delete_user',
      targetUserId: user._id,
      targetUserEmail: user.email,
      details: `Admin soft-deleted user account ${user.name} (${user.email}). Historical records preserved.`,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been deleted (soft delete). Historical order data preserved.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin audit logs
// @route   GET /api/admin/users/audit-logs
// @access  Private/Admin
const getAuditLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(limit).lean();

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserStats,
  getUsers,
  getUserById,
  getUserOrders,
  getUserWishlist,
  getUserCart,
  getUserActivity,
  getUserRecommendations,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getAuditLogs,
};
