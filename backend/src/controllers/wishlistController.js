const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { recordInteraction } = require('../services/interactionService');

const mongoose = require('mongoose');
const { productsData } = require('../scripts/seed');

const fallbackProducts = (productsData || []).map((p, idx) => ({
  _id: p._id || `seed_prod_${p.sku || idx + 1}`,
  ...p,
}));

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = null;
    if (mongoose.connection.readyState === 1) {
      try {
        wishlist = await Wishlist.findOne({ userId: req.user._id }).populate({
          path: 'products',
          select: 'name price originalPrice discountPercentage images brand category stock rating ratingCount',
        });
      } catch (err) {
        console.warn('[Wishlist Controller] DB getWishlist warning:', err.message);
      }
    }

    const validProducts = wishlist?.products ? wishlist.products.filter((p) => p !== null && p !== undefined) : [];

    res.status(200).json({
      success: true,
      count: validProducts.length,
      wishlist: validProducts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or toggle product in wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
exports.toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let product = null;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(productId)) {
      try {
        product = await Product.findById(productId);
      } catch (err) {
        // Fallthrough
      }
    }

    if (!product) {
      product = fallbackProducts.find(
        (p) => String(p._id) === String(productId) || String(p.id) === String(productId) || p.sku === productId
      );
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    let wishlist = null;
    if (mongoose.connection.readyState === 1) {
      try {
        wishlist = await Wishlist.findOne({ userId: req.user._id });
        if (!wishlist) {
          wishlist = new Wishlist({
            userId: req.user._id,
            products: [],
          });
        }
      } catch (err) {
        // Fallthrough
      }
    }

    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user._id, products: [] });
    }

    const productIndex = wishlist.products.findIndex(
      (id) => String(id) === String(product._id) || String(id) === String(productId)
    );

    let inWishlist = false;

    if (productIndex > -1) {
      wishlist.products.splice(productIndex, 1);
      inWishlist = false;
    } else {
      wishlist.products.push(product._id);
      inWishlist = true;

      recordInteraction({
        userId: req.user._id,
        productId: product._id,
        type: 'wishlist',
        metadata: { source: 'wishlist_toggle' },
      }).catch(() => {});
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await wishlist.save();
      } catch (err) {
        console.warn('[Wishlist Controller] Save warning:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: inWishlist ? `Saved ${product.name} to wishlist` : `Removed ${product.name} from wishlist`,
      inWishlist,
      count: wishlist.products.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
    }

    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId.toString()
    );

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      count: wishlist.products.length,
    });
  } catch (error) {
    next(error);
  }
};
