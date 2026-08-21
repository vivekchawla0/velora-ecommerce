const express = require('express');
const router = express.Router();
const { updateReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:reviewId')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
