const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.Mixed,
        ref: 'Product',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual for item count
wishlistSchema.virtual('totalItems').get(function () {
  return this.products.length;
});

wishlistSchema.set('toJSON', { virtuals: true });
wishlistSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
