const mongoose = require('mongoose');

const recommendationFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['not_interested', 'already_bought', 'irrelevant'],
      default: 'not_interested',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Prevent duplicate feedback per user per product
recommendationFeedbackSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('RecommendationFeedback', recommendationFeedbackSchema);
