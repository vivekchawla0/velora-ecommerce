const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Price must be positive'],
      index: true,
    },
    originalPrice: {
      type: Number,
      default: function () {
        return this.price;
      },
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Please specify a brand'],
      trim: true,
      index: true,
    },
    images: {
      type: [String],
      required: [true, 'Please provide at least one product image'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A product must have at least one image.',
      },
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot be above 5'],
      index: true,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Please specify stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 50,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    specs: {
      type: Map,
      of: String,
      default: {},
    },
    asin: {
      type: String,
      trim: true,
      index: true,
    },
    amazonUrl: {
      type: String,
      trim: true,
    },
    affiliateUrl: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ['amazon', 'catalog', 'demo'],
      default: 'catalog',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    collections: {
      type: [String],
      default: ['shop-all'],
      index: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for fast search queries
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text',
});

module.exports = mongoose.model('Product', productSchema);
