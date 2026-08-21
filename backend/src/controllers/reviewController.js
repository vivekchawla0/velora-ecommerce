const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { recordInteraction } = require('../services/interactionService');

// @desc    Get all reviews for a product with rating distribution breakdown
// @route   GET /api/products/:productId/reviews
// @access  Public
exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const reviews = await Review.find({ productId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    // Calculate rating breakdown distribution
    const breakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((rev) => {
      const r = Math.round(rev.rating);
      if (breakdown[r] !== undefined) {
        breakdown[r] += 1;
      }
    });

    const totalReviews = reviews.length;
    const distributionPercentages = {
      5: totalReviews > 0 ? Math.round((breakdown[5] / totalReviews) * 100) : 0,
      4: totalReviews > 0 ? Math.round((breakdown[4] / totalReviews) * 100) : 0,
      3: totalReviews > 0 ? Math.round((breakdown[3] / totalReviews) * 100) : 0,
      2: totalReviews > 0 ? Math.round((breakdown[2] / totalReviews) * 100) : 0,
      1: totalReviews > 0 ? Math.round((breakdown[1] / totalReviews) * 100) : 0,
    };

    const avg =
      totalReviews > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
        : product.rating || 4.5;

    res.status(200).json({
      success: true,
      count: totalReviews,
      averageRating: avg,
      breakdown,
      distributionPercentages,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update review for a product
// @route   POST /api/products/:productId/reviews
// @access  Private
exports.createProductReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, title = '', comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5 stars.',
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Review comment is required.',
      });
    }

    // Determine verified purchase by checking actual completed orders in MongoDB
    const pastOrder = await Order.findOne({
      userId: req.user._id,
      'items.productId': productId,
    });

    const isVerifiedPurchase = !!pastOrder;

    // Upsert review (one review per user per product)
    const review = await Review.findOneAndUpdate(
      { userId: req.user._id, productId: product._id },
      {
        rating: numRating,
        title: title.trim(),
        comment: comment.trim(),
        verifiedPurchase: isVerifiedPurchase,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).populate('userId', 'name');

    // Recalculate average rating on Product
    await Review.calcAverageRating(productId);

    // Record interaction (weight = rating score)
    recordInteraction({
      userId: req.user._id,
      productId: product._id,
      type: 'rating',
      ratingValue: numRating,
      metadata: { source: 'product_review' },
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing review
// @route   PUT /api/reviews/:reviewId
// @access  Private
exports.updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Only owner or admin can edit
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this review',
      });
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }
      review.rating = numRating;
    }

    if (title !== undefined) review.title = title.trim();
    if (comment !== undefined) review.comment = comment.trim();

    await review.save();
    await Review.calcAverageRating(review.productId);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Only owner or admin can delete
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    const productId = review.productId;
    await review.deleteOne();
    await Review.calcAverageRating(productId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
