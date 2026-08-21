const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeGuestCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

// All cart routes require authentication
router.use(protect);

router.route('/')
  .get(getCart)
  .delete(clearCart);

router.post('/add', addToCart);
router.post('/merge', mergeGuestCart);

router.route('/:productId')
  .patch(updateCartItem)
  .delete(removeFromCart);

module.exports = router;
