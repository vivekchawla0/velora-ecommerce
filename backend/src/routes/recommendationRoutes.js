const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  submitFeedback,
  getSimilar,
  getMLHealth,
} = require('../controllers/recommendationController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, getRecommendations);
router.post('/feedback', protect, submitFeedback);
router.get('/similar/:productId', getSimilar);
router.get('/health', getMLHealth);

module.exports = router;
