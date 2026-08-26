const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { productsData, categoriesData } = require('../scripts/seed');

// Format fallback products dataset with IDs and default timestamps
const fallbackProducts = (productsData || []).map((p, idx) => ({
  _id: p._id || `seed_prod_${p.sku || idx + 1}`,
  ...p,
  createdAt: p.createdAt || new Date(Date.now() - idx * 3600000).toISOString(),
}));

const fallbackCategories = categoriesData || [];

// Compute category counts for fallback dataset
const fallbackCountMap = new Map();
fallbackProducts.forEach((p) => {
  if (p.category) {
    const key = String(p.category).toLowerCase();
    fallbackCountMap.set(key, (fallbackCountMap.get(key) || 0) + 1);
  }
});

// @desc    Get all products with filtering, search, sorting & pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      q,
      category,
      brand,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      featured,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    let products = [];
    let total = 0;

    const isDemoMode = (process.env.PRODUCT_DATA_MODE || 'amazon').toLowerCase() === 'demo';

    // 1. Try DB Query ONLY if Mongoose is connected (readyState === 1)
    if (mongoose.connection.readyState === 1) {
      try {
        const query = { isActive: { $ne: false } };

        if (q) {
          query.$or = [
            { name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { brand: { $regex: q, $options: 'i' } },
            { tags: { $in: [new RegExp(q, 'i')] } },
          ];
        }

        if (category && category !== 'all') {
          query.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }

        if (brand && brand !== 'all') {
          query.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
          query.price = {};
          if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice);
          if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice);
          if (Object.keys(query.price).length === 0) delete query.price;
        }

        if (minRating) {
          query.rating = { $gte: Number(minRating) };
        }

        if (inStock === 'true') {
          query.stock = { $gt: 0 };
        }

        if (featured === 'true') {
          query.featured = true;
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { price: 1 };
        else if (sort === 'price_desc') sortOption = { price: -1 };
        else if (sort === 'rating') sortOption = { rating: -1, ratingCount: -1 };
        else if (sort === 'discount') sortOption = { discountPercentage: -1 };
        else if (sort === 'popular') sortOption = { ratingCount: -1, rating: -1 };

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 12;
        const skip = (pageNum - 1) * limitNum;

        [products, total] = await Promise.all([
          Product.find(query).select('-description -reviews -specifications').sort(sortOption).skip(skip).limit(limitNum).lean(),
          Product.countDocuments(query),
        ]);
      } catch (dbErr) {
        console.warn('[Product Controller] DB Query Failed:', dbErr.message);
      }
    }

    // 2. Query fallback seed dataset in memory ONLY if isDemoMode is true and DB returned 0 products
    if (isDemoMode && (!products || products.length === 0)) {
      let filtered = [...fallbackProducts];

      if (q) {
        const lq = q.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name?.toLowerCase().includes(lq) ||
            p.description?.toLowerCase().includes(lq) ||
            p.brand?.toLowerCase().includes(lq)
        );
      }

      if (category && category !== 'all') {
        const lc = category.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.category?.toLowerCase() === lc ||
            p.category?.toLowerCase()?.replace(/\s+/g, '-') === lc
        );
      }

      if (brand && brand !== 'all') {
        filtered = filtered.filter((p) => p.brand?.toLowerCase() === brand.toLowerCase());
      }

      if (minPrice) filtered = filtered.filter((p) => p.price >= Number(minPrice));
      if (maxPrice) filtered = filtered.filter((p) => p.price <= Number(maxPrice));
      if (minRating) filtered = filtered.filter((p) => p.rating >= Number(minRating));
      if (inStock === 'true') filtered = filtered.filter((p) => p.stock > 0);
      if (featured === 'true') filtered = filtered.filter((p) => p.featured);

      if (sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
      else if (sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
      else if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
      else if (sort === 'popular') filtered.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));

      total = filtered.length;
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 12;
      const skip = (pageNum - 1) * limitNum;
      products = filtered.slice(skip, skip + limitNum);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalProducts: total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID or SKU or Slug
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    let product = null;

    if (mongoose.connection.readyState === 1) {
      try {
        if (mongoose.Types.ObjectId.isValid(targetId)) {
          product = await Product.findById(targetId).lean();
        }
        if (!product) {
          product = await Product.findOne({
            $or: [{ sku: targetId }, { slug: targetId }],
          }).lean();
        }
      } catch (err) {
        console.warn('[Product Controller] DB lookup error:', err.message);
      }
    }

    const isDemoMode = (process.env.PRODUCT_DATA_MODE || 'amazon').toLowerCase() === 'demo';
    if (!product && isDemoMode) {
      product = fallbackProducts.find(
        (p) =>
          String(p._id) === String(targetId) ||
          String(p.id) === String(targetId) ||
          p.sku === targetId ||
          p.slug === targetId
      );
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found with specified ID.',
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories with product counts
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    let categories = [];
    try {
      categories = await Category.find().lean();
    } catch (err) {
      console.warn('[Categories Controller] DB query error:', err.message);
    }

    if (!categories || categories.length === 0) {
      categories = fallbackCategories;
    }

    let counts = [];
    try {
      counts = await Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]);
    } catch (err) {
      // Ignore DB aggregation error
    }

    const countMap = new Map(
      counts.map((c) => [c._id ? String(c._id).toLowerCase() : '', c.count])
    );

    const enrichedCategories = categories.map((cat) => {
      const slugKey = (cat.slug || '').toLowerCase();
      const nameKey = (cat.name || '').toLowerCase();
      const count =
        countMap.get(slugKey) ||
        countMap.get(nameKey) ||
        fallbackCountMap.get(slugKey) ||
        fallbackCountMap.get(nameKey) ||
        0;

      return {
        ...cat,
        productCount: count,
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedCategories.length,
      categories: enrichedCategories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res, next) => {
  try {
    let featured = [];
    try {
      featured = await Product.find({ featured: true })
        .sort({ rating: -1 })
        .limit(8)
        .lean();
    } catch (err) {
      console.warn('[Featured Controller] DB query error:', err.message);
    }

    if (!featured || featured.length === 0) {
      featured = fallbackProducts.filter((p) => p.featured).slice(0, 8);
    }

    res.status(200).json({
      success: true,
      count: featured.length,
      products: featured,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  getFeaturedProducts,
};
