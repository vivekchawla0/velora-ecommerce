const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [120, 'Review title cannot exceed 120 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [2000, 'Review comment cannot exceed 2000 characters'],
    },
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });

/**
 * Static method to calculate and update average rating on Product model
 */
reviewSchema.statics.calcAverageRating = async function (productId) {
  const Product = mongoose.model('Product');
  const stats = await this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$productId',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: Number(stats[0].avgRating.toFixed(1)),
      ratingCount: stats[0].nRating,
    });
  } else {
    // If no reviews left, fallback to default
    await Product.findByIdAndUpdate(productId, {
      rating: 4.5,
      ratingCount: 0,
    });
  }
};

module.exports = mongoose.model('Review', reviewSchema);
