const {
  getPersonalizedRecommendations,
  getSimilarProducts,
  checkMLServiceHealth,
} = require('../services/recommendationClient');
const RecommendationFeedback = require('../models/RecommendationFeedback');
const Product = require('../models/Product');

const Interaction = require('../models/Interaction');

// @desc    Get personalized product recommendations for active/guest user (excluding already interacted items)
// @route   GET /api/recommendations
// @access  Public (Optional Auth)
const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id.toString() : 'guest';
    const limit = parseInt(req.query.limit, 10) || 8;

    // Retrieve user's dismissed products & already interacted products
    let excludedProductIds = [];
    let interactedCount = 0;
    if (req.user) {
      // 1. Negative feedback
      const feedbacks = await RecommendationFeedback.find({ userId: req.user._id });
      const feedbackIds = feedbacks.map((f) => f.productId.toString());

      // 2. Already interacted items (view, click, wishlist, cart, purchase, rating)
      const userInteractions = await Interaction.find({ userId: req.user._id }).select('productId');
      const interactedIds = userInteractions
        .filter((i) => i.productId)
        .map((i) => i.productId.toString());

      interactedCount = interactedIds.length;
      excludedProductIds = Array.from(new Set([...feedbackIds, ...interactedIds]));
    }

    console.log(
      `[Recommender Controller] userId: "${userId}" | interacted products: ${interactedCount} | excluded products: ${excludedProductIds.length}`
    );

    const result = await getPersonalizedRecommendations(userId, limit, excludedProductIds);

    const finalRecommendedIds = result.data.map((p) => (p._id ? p._id.toString() : p.productId));
    console.log(
      `[Recommender Controller] userId: "${userId}" | final recommended product IDs (${finalRecommendedIds.length}):`,
      finalRecommendedIds
    );

    res.status(200).json({
      success: true,
      userId,
      source: result.source,
      reason: result.reason || (req.user ? 'Recommended based on your recent activity' : 'Top trending bestseller across all shoppers'),
      count: result.data.length,
      recommendations: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record negative / dismissal feedback for a recommendation
// @route   POST /api/recommendations/feedback
// @access  Private
const submitFeedback = async (req, res, next) => {
  try {
    const { productId, type = 'not_interested' } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Upsert feedback
    await RecommendationFeedback.findOneAndUpdate(
      { userId: req.user._id, productId: product._id },
      { type, createdAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: "We'll show you fewer recommendations like this.",
      productId: product._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get item-item similar products for a given product ID
// @route   GET /api/recommendations/similar/:productId
// @access  Public
const getSimilar = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 6;

    const similar = await getSimilarProducts(productId, limit);

    res.status(200).json({
      success: true,
      productId,
      count: similar.length,
      recommendations: similar,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check recommendation microservice health
// @route   GET /api/recommendations/health
// @access  Public
const getMLHealth = async (req, res, next) => {
  try {
    const health = await checkMLServiceHealth();
    res.status(200).json({
      success: true,
      service: 'recommendation-service',
      health,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  submitFeedback,
  getSimilar,
  getMLHealth,
};
