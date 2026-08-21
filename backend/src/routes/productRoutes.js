const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getCategories,
  getFeaturedProducts,
} = require('../controllers/productController');
const {
  getProductReviews,
  createProductReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProductById);

// Reviews for a product
router.route('/:productId/reviews')
  .get(getProductReviews)
  .post(protect, createProductReview);

module.exports = router;
