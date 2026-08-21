const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/adminController');
const {
  getUserStats,
  getUsers,
  getUserById,
  getUserOrders,
  getUserWishlist,
  getUserCart,
  getUserActivity,
  getUserRecommendations,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getAuditLogs,
} = require('../controllers/adminUserController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require authentication and 'admin' role
router.use(protect, authorize('admin'));

// Store Statistics
router.get('/stats', getAdminStats);

// Product Management
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Order Management
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

// User Management Routes
router.get('/users/stats', getUserStats);
router.get('/users/audit-logs', getAuditLogs);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.get('/users/:id/orders', getUserOrders);
router.get('/users/:id/wishlist', getUserWishlist);
router.get('/users/:id/cart', getUserCart);
router.get('/users/:id/activity', getUserActivity);
router.get('/users/:id/recommendations', getUserRecommendations);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
