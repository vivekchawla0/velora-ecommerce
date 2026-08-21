const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { recordInteraction } = require('../services/interactionService');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user._id }).populate({
      path: 'products',
      select: 'name price originalPrice discountPercentage images brand category stock rating ratingCount',
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        userId: req.user._id,
        products: [],
      });
    }

    // Filter out any deleted products
    const validProducts = wishlist.products.filter((p) => p !== null && p !== undefined);
    if (validProducts.length !== wishlist.products.length) {
      wishlist.products = validProducts.map((p) => p._id);
      await wishlist.save();
    }

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

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.user._id,
        products: [],
      });
    }

    const productIndex = wishlist.products.findIndex(
      (id) => id.toString() === productId.toString()
    );

    let inWishlist = false;

    if (productIndex > -1) {
      // Remove from wishlist
      wishlist.products.splice(productIndex, 1);
      inWishlist = false;
    } else {
      // Add to wishlist
      wishlist.products.push(product._id);
      inWishlist = true;

      // Automatically log implicit wishlist interaction (weight = 3.0) for recommendations
      recordInteraction({
        userId: req.user._id,
        productId: product._id,
        type: 'wishlist',
        metadata: { source: 'wishlist_toggle' },
      }).catch(() => {});
    }

    await wishlist.save();

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
