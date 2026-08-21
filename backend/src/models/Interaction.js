const mongoose = require('mongoose');

const INTERACTION_WEIGHTS = {
  view: 1.0,
  click: 2.0,
  wishlist: 3.0,
  cart: 4.0,
  purchase: 5.0,
  rating: 3.0, // default if ratingValue is not specified
};

const interactionSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['view', 'click', 'wishlist', 'cart', 'purchase', 'rating'],
      required: [true, 'Interaction type is required'],
      index: true,
    },
    weight: {
      type: Number,
      default: function () {
        if (this.type === 'rating' && this.ratingValue) {
          return this.ratingValue;
        }
        return INTERACTION_WEIGHTS[this.type] || 1.0;
      },
    },
    ratingValue: {
      type: Number,
      min: 1,
      max: 5,
    },
    metadata: {
      source: { type: String, default: 'web' },
      sessionId: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user interactions aggregation and recommendation training
interactionSchema.index({ userId: 1, productId: 1, type: 1 });
interactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Interaction', interactionSchema);
module.exports.INTERACTION_WEIGHTS = INTERACTION_WEIGHTS;
