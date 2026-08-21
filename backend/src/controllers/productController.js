const Product = require('../models/Product');
const Category = require('../models/Category');

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

    const query = {};

    // 1. Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ];
    }

    // 2. Category filter (slug or name)
    if (category && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // 3. Brand filter
    if (brand && brand !== 'all') {
      query.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
    }

    // 4. Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice);
      if (Object.keys(query.price).length === 0) delete query.price;
    }

    // 5. Rating filter
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    // 6. In Stock filter
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // 7. Featured flag
    if (featured === 'true') {
      query.featured = true;
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { rating: -1, ratingCount: -1 };
    else if (sort === 'discount') sortOption = { discountPercentage: -1 };
    else if (sort === 'popular') sortOption = { ratingCount: -1, rating: -1 };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
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
    const categories = await Category.find().lean();
    
    // Compute item counts for each category
    const counts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(counts.map((c) => [c._id.toLowerCase(), c.count]));

    const enrichedCategories = categories.map((cat) => ({
      ...cat,
      productCount: countMap.get(cat.name.toLowerCase()) || countMap.get(cat.slug.toLowerCase()) || 0,
    }));

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
    const featured = await Product.find({ featured: true })
      .sort({ rating: -1 })
      .limit(8)
      .lean();

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
