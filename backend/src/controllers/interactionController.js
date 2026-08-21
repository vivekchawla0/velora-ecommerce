const Interaction = require('../models/Interaction');
const Product = require('../models/Product');
const { recordInteraction } = require('../services/interactionService');

// @desc    Record a user interaction (view, click, cart, purchase, rating)
// @route   POST /api/interactions
// @access  Private
const createInteraction = async (req, res, next) => {
  try {
    const { productId, type, ratingValue, metadata } = req.body;

    if (!productId || !type) {
      return res.status(400).json({
        success: false,
        message: 'productId and type are required.',
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Target product does not exist.',
      });
    }

    const interaction = await recordInteraction({
      userId: req.user._id,
      productId,
      type,
      ratingValue,
      metadata,
    });

    res.status(201).json({
      success: true,
      message: `Interaction of type '${type}' recorded.`,
      interaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's interaction history
// @route   GET /api/interactions/my-history
// @access  Private
const getMyInteractions = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;

    const history = await Interaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('productId', 'name price images category rating ratingCount')
      .lean();

    res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user interaction activity summary
// @route   GET /api/interactions/summary
// @access  Private
const getInteractionSummary = async (req, res, next) => {
  try {
    const summary = await Interaction.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalWeight: { $sum: '$weight' },
        },
      },
    ]);

    const stats = {
      views: 0,
      clicks: 0,
      carts: 0,
      purchases: 0,
      ratings: 0,
      totalInteractions: 0,
    };

    summary.forEach((item) => {
      if (item._id === 'view') stats.views = item.count;
      else if (item._id === 'click') stats.clicks = item.count;
      else if (item._id === 'cart') stats.carts = item.count;
      else if (item._id === 'purchase') stats.purchases = item.count;
      else if (item._id === 'rating') stats.ratings = item.count;
      stats.totalInteractions += item.count;
    });

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export interaction matrix data for ML training
// @route   GET /api/interactions/training-data
// @access  Public / Internal ML
const getTrainingData = async (req, res, next) => {
  try {
    const interactions = await Interaction.find()
      .select('userId productId type weight createdAt')
      .lean();

    const formatted = interactions.map((i) => ({
      user_id: i.userId.toString(),
      product_id: i.productId.toString(),
      interaction_type: i.type,
      weight: i.weight,
      timestamp: i.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInteraction,
  getMyInteractions,
  getInteractionSummary,
  getTrainingData,
};
