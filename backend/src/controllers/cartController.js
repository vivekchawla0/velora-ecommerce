const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { recordInteraction } = require('../services/interactionService');

/**
 * Format and populate cart helper
 */
const formatPopulatedCart = async (cart) => {
  await cart.populate({
    path: 'items.productId',
    select: 'name price originalPrice discountPercentage images brand category stock rating ratingCount',
  });

  // Filter out any items where the product might have been deleted from catalog
  const validItems = cart.items.filter((item) => item.productId !== null && item.productId !== undefined);
  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  const items = cart.items.map((item) => ({
    product: item.productId,
    quantity: item.quantity,
    price: item.price,
    itemTotal: Number((item.price * item.quantity).toFixed(2)),
  }));

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = Number(items.reduce((sum, i) => sum + i.itemTotal, 0).toFixed(2));
  const tax = Number((subtotal * 0.08).toFixed(2));
  const shippingFee = subtotal >= 50 || subtotal === 0 ? 0 : 5.99;
  const totalAmount = Number((subtotal + tax + shippingFee).toFixed(2));

  return {
    _id: cart._id,
    userId: cart.userId,
    items,
    totalItems,
    subtotal,
    tax,
    shippingFee,
    totalAmount,
    updatedAt: cart.updatedAt,
  };
};

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        items: [],
      });
    }

    const formatted = await formatPopulatedCart(cart);

    res.status(200).json({
      success: true,
      cart: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart or increment quantity
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer',
      });
    }

    // 1. Verify product exists and has sufficient stock in MongoDB
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // 2. Find or create user cart
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({
        userId: req.user._id,
        items: [],
      });
    }

    // 3. Check existing item in cart
    const existingIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    let newQuantity = qty;
    if (existingIndex > -1) {
      newQuantity = cart.items[existingIndex].quantity + qty;
    }

    // 4. Validate stock against live database inventory
    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock.`,
        availableStock: product.stock,
      });
    }

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = newQuantity;
      cart.items[existingIndex].price = product.price; // Use trusted database price
    } else {
      cart.items.push({
        productId: product._id,
        quantity: qty,
        price: product.price, // Use trusted database price
      });
    }

    await cart.save();

    // 5. Automatically log implicit cart interaction (weight = 4.0) to feed recommender
    recordInteraction({
      userId: req.user._id,
      productId: product._id,
      type: 'cart',
      metadata: { source: 'cart_add', quantity: qty },
    }).catch(() => {});

    const formatted = await formatPopulatedCart(cart);

    res.status(200).json({
      success: true,
      message: `Added ${product.name} to cart`,
      cart: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PATCH /api/cart/:productId
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity value',
      });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not in cart',
      });
    }

    // If quantity is 0, remove item
    if (qty === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      // Validate stock
      const product = await Product.findById(productId);
      if (!product) {
        cart.items.splice(itemIndex, 1);
      } else {
        if (qty > product.stock) {
          return res.status(400).json({
            success: false,
            message: `Only ${product.stock} units available in stock.`,
            availableStock: product.stock,
          });
        }
        cart.items[itemIndex].quantity = qty;
        cart.items[itemIndex].price = product.price;
      }
    }

    await cart.save();
    const formatted = await formatPopulatedCart(cart);

    res.status(200).json({
      success: true,
      cart: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId.toString()
    );

    await cart.save();
    const formatted = await formatPopulatedCart(cart);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart: {
        items: [],
        totalItems: 0,
        subtotal: 0,
        tax: 0,
        shippingFee: 0,
        totalAmount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Merge guest cart items into user's authenticated database cart on login
// @route   POST /api/cart/merge
// @access  Private
exports.mergeGuestCart = async (req, res, next) => {
  try {
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      let cart = await Cart.findOne({ userId: req.user._id });
      if (!cart) cart = await Cart.create({ userId: req.user._id, items: [] });
      const formatted = await formatPopulatedCart(cart);
      return res.status(200).json({ success: true, cart: formatted });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    for (const guestItem of items) {
      if (!guestItem.productId && !guestItem.product?._id) continue;
      const pId = guestItem.productId || guestItem.product._id;
      const qty = parseInt(guestItem.quantity, 10) || 1;

      const product = await Product.findById(pId);
      if (!product || product.stock <= 0) continue;

      const existingIndex = cart.items.findIndex(
        (item) => item.productId.toString() === pId.toString()
      );

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity = Math.min(
          cart.items[existingIndex].quantity + qty,
          product.stock
        );
        cart.items[existingIndex].price = product.price;
      } else {
        cart.items.push({
          productId: product._id,
          quantity: Math.min(qty, product.stock),
          price: product.price,
        });
      }
    }

    await cart.save();
    const formatted = await formatPopulatedCart(cart);

    res.status(200).json({
      success: true,
      message: 'Cart merged successfully',
      cart: formatted,
    });
  } catch (error) {
    next(error);
  }
};
