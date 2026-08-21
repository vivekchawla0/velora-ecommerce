const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Interaction = require('../src/models/Interaction');
const Cart = require('../src/models/Cart');
const Wishlist = require('../src/models/Wishlist');
const Review = require('../src/models/Review');
const RecommendationFeedback = require('../src/models/RecommendationFeedback');
const AuditLog = require('../src/models/AuditLog');
require('./setup');

describe('Velora Backend API Endpoints', () => {
  let authToken = '';
  let adminToken = '';
  let testUserId = '';
  let testProductId = '';

  beforeAll(async () => {
    // 1. Register test user
    const resUser = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Buyer',
        email: 'buyer@test.com',
        password: 'Password123!',
      });
    expect(resUser.status).toBe(201);
    authToken = resUser.body.token;
    testUserId = resUser.body.user.id;

    // 2. Register admin user
    const resAdmin = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'AdminPassword123!',
        role: 'admin',
      });
    expect(resAdmin.status).toBe(201);
    adminToken = resAdmin.body.token;

    // 3. Create test product via admin
    const resProd = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Quantum Headphones',
        description: 'High fidelity audio test product with noise cancellation.',
        price: 199.99,
        category: 'audio',
        brand: 'AeroSound',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
        stock: 50,
        tags: ['audio', 'bluetooth'],
      });
    expect(resProd.status).toBe(201);
    testProductId = resProd.body.product._id;
  });

  describe('Health Check API', () => {
    it('should return 200 and healthy status with Velora service name', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service.toLowerCase()).toContain('velora');
    });
  });

  describe('Authentication API (/api/auth)', () => {
    it('should authenticate user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer@test.com',
          password: 'Password123!',
        });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('buyer@test.com');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer@test.com',
          password: 'WrongPassword!',
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should get current authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('buyer@test.com');
    });
  });

  describe('Product API (/api/products)', () => {
    it('should list products with pagination and counts', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('should fetch product by ID', async () => {
      const res = await request(app).get(`/api/products/${testProductId}`);
      expect(res.status).toBe(200);
      expect(res.body.product.name).toBe('Test Quantum Headphones');
    });
  });

  describe('Wishlist API (/api/wishlist)', () => {
    it('should fetch user wishlist (initially empty)', async () => {
      const res = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
    });

    it('should add item to wishlist and record interaction (weight = 3.0)', async () => {
      const res = await request(app)
        .post(`/api/wishlist/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.inWishlist).toBe(true);
      expect(res.body.count).toBe(1);

      // Verify interaction logged with weight 3.0
      const interaction = await Interaction.findOne({
        userId: testUserId,
        productId: testProductId,
        type: 'wishlist',
      });
      expect(interaction).not.toBeNull();
      expect(interaction.weight).toBe(3.0);
    });

    it('should toggle item off wishlist when requested again', async () => {
      const res = await request(app)
        .post(`/api/wishlist/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.inWishlist).toBe(false);
      expect(res.body.count).toBe(0);
    });

    it('should remove item from wishlist via DELETE endpoint', async () => {
      // Add first
      await request(app)
        .post(`/api/wishlist/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const res = await request(app)
        .delete(`/api/wishlist/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
    });
  });

  describe('Cart API (/api/cart)', () => {
    it('should fetch user cart (initially empty)', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cart.totalItems).toBe(0);
    });

    it('should add an item to the cart and calculate server-side subtotal', async () => {
      const res = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          quantity: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cart.totalItems).toBe(2);
      expect(res.body.cart.subtotal).toBe(399.98);
      expect(res.body.cart.items.length).toBe(1);
    });

    it('should update cart item quantity', async () => {
      const res = await request(app)
        .patch(`/api/cart/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 3 });

      expect(res.status).toBe(200);
      expect(res.body.cart.totalItems).toBe(3);
      expect(res.body.cart.subtotal).toBe(599.97);
    });

    it('should reject quantity exceeding product stock', async () => {
      const res = await request(app)
        .patch(`/api/cart/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 9999 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('stock');
    });

    it('should remove item from cart', async () => {
      const res = await request(app)
        .delete(`/api/cart/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.cart.totalItems).toBe(0);
      expect(res.body.cart.subtotal).toBe(0);
    });
  });

  describe('Interaction Tracking API (/api/interactions)', () => {
    it('should record view interaction event with proper weight', async () => {
      const res = await request(app)
        .post('/api/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          type: 'view',
        });
      expect(res.status).toBe(201);
      expect(res.body.interaction.weight).toBe(1.0);
    });

    it('should record cart interaction event with weight 4.0', async () => {
      const res = await request(app)
        .post('/api/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          type: 'cart',
        });
      expect(res.status).toBe(201);
      expect(res.body.interaction.weight).toBe(4.0);
    });

    it('should get user interaction summary statistics', async () => {
      const res = await request(app)
        .get('/api/interactions/summary')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.stats.views).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Order Processing API (/api/orders)', () => {
    it('should place an order, decrease product stock, and clear user cart', async () => {
      // Add product to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProductId, quantity: 1 });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ productId: testProductId, quantity: 1 }],
          shippingAddress: {
            fullName: 'Alex Morgan',
            street: '123 Tech Way',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
          },
          paymentMethod: 'credit_card',
        });

      expect(res.status).toBe(201);
      expect(res.body.order.status).toBe('Processing');
      expect(res.body.order.paymentStatus).toBe('completed');

      // Product stock decreased
      const updatedProduct = await Product.findById(testProductId);
      expect(updatedProduct.stock).toBe(49);

      // Cart cleared
      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);
      expect(cartRes.body.cart.totalItems).toBe(0);
    });

    it('should list orders for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.orders.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Product Reviews & Ratings API (/api/products/:id/reviews)', () => {
    let createdReviewId = '';

    it('should create a review with verified purchase flag derived from order history', async () => {
      const res = await request(app)
        .post(`/api/products/${testProductId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          title: 'Phenomenal Sound Quality',
          comment: 'The active noise cancellation is world class. Truly premium build quality.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.review.rating).toBe(5);
      expect(res.body.review.verifiedPurchase).toBe(true);
      createdReviewId = res.body.review._id;

      // Verify product average rating was updated
      const prod = await Product.findById(testProductId);
      expect(prod.rating).toBe(5);
      expect(prod.ratingCount).toBe(1);
    });

    it('should reject invalid rating outside 1 to 5 range', async () => {
      const res = await request(app)
        .post(`/api/products/${testProductId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 6,
          comment: 'Invalid rating test',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fetch product reviews with rating breakdown distribution', async () => {
      const res = await request(app).get(`/api/products/${testProductId}/reviews`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.averageRating).toBe(5);
      expect(res.body.distributionPercentages['5']).toBe(100);
      expect(res.body.reviews[0].verifiedPurchase).toBe(true);
    });

    it('should update user review and recalculate average rating', async () => {
      const res = await request(app)
        .put(`/api/reviews/${createdReviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 4,
          comment: 'Updated review: Still great, slightly heavy.',
        });

      expect(res.status).toBe(200);
      expect(res.body.review.rating).toBe(4);

      const prod = await Product.findById(testProductId);
      expect(prod.rating).toBe(4);
    });

    it('should delete review and restore default product rating', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${createdReviewId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const prod = await Product.findById(testProductId);
      expect(prod.ratingCount).toBe(0);
    });
  });

  describe('Recommendation Feedback & Explainability API', () => {
    it('should submit "not_interested" feedback for a product', async () => {
      const res = await request(app)
        .post('/api/recommendations/feedback')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProductId,
          type: 'not_interested',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('fewer recommendations');

      const fb = await RecommendationFeedback.findOne({
        userId: testUserId,
        productId: testProductId,
      });
      expect(fb).not.toBeNull();
      expect(fb.type).toBe('not_interested');
    });

    it('should exclude dismissed product from personalized recommendations', async () => {
      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const recIds = res.body.recommendations.map((r) => r._id.toString());
      expect(recIds).not.toContain(testProductId.toString());
    });
  });

  describe('Admin User Management API (/api/admin/users)', () => {
    let dummyUserId = '';
    let dummyUserEmail = 'dummy_test_shopper@test.com';

    beforeAll(async () => {
      const dummyRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Dummy Shopper',
          email: dummyUserEmail,
          password: 'Password123!',
        });
      dummyUserId = dummyRes.body.user.id;
    });

    it('should get real user management stats from database', async () => {
      const res = await request(app)
        .get('/api/admin/users/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.totalUsers).toBeGreaterThanOrEqual(2);
      expect(res.body.stats.activeUsers).toBeGreaterThanOrEqual(2);
      expect(res.body.stats.adminUsers).toBeGreaterThanOrEqual(1);
    });

    it('should list paginated users for admin with order counts', async () => {
      const res = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);
      expect(res.body.users[0].password).toBeUndefined();
    });

    it('should reject non-admin users from accessing /api/admin/users with 403', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
    });

    it('should search users by name or email', async () => {
      const res = await request(app)
        .get('/api/admin/users?q=Dummy')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users.length).toBe(1);
      expect(res.body.users[0].name).toBe('Dummy Shopper');
    });

    it('should filter users by role and status', async () => {
      const res = await request(app)
        .get('/api/admin/users?role=admin&status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users.every((u) => u.role === 'admin')).toBe(true);
    });

    it('should fetch user details by ID with aggregated platform statistics', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('buyer@test.com');
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.stats.ordersCount).toBeGreaterThanOrEqual(1);
      expect(res.body.stats.totalSpent).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent user ID', async () => {
      const nonExistentId = '666666666666666666666666';
      const res = await request(app)
        .get(`/api/admin/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should fetch user order history', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${testUserId}/orders`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.orders)).toBe(true);
    });

    it('should fetch user wishlist', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${testUserId}/wishlist`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.wishlist)).toBe(true);
    });

    it('should fetch user cart (read-only)', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${testUserId}/cart`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.cart).toBeDefined();
      expect(res.body.cart.totalItems).toBeDefined();
    });

    it('should fetch user activity stream and calculated category interests', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${testUserId}/activity`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.activity)).toBe(true);
      expect(Array.isArray(res.body.topInterests)).toBe(true);
    });

    it('should fetch user recommendations with explainability and feedback', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${testUserId}/recommendations`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.service).toContain('Velora');
      expect(res.body.feedback.dismissedCount).toBeGreaterThanOrEqual(1);
    });

    it('should block a user and record audit log', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${dummyUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'blocked' });

      expect(res.status).toBe(200);
      expect(res.body.user.status).toBe('blocked');

      const audit = await AuditLog.findOne({
        targetUserId: dummyUserId,
        action: 'block_user',
      });
      expect(audit).not.toBeNull();
    });

    it('should reject login from blocked user with 403 status and safe message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: dummyUserEmail,
          password: 'Password123!',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Your account is currently blocked');
    });

    it('should unblock user and allow successful login', async () => {
      const unblockRes = await request(app)
        .patch(`/api/admin/users/${dummyUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' });

      expect(unblockRes.status).toBe(200);
      expect(unblockRes.body.user.status).toBe('active');

      // Now login succeeds
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: dummyUserEmail,
          password: 'Password123!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeDefined();
    });

    it('should change user role to admin and back to user', async () => {
      const roleRes = await request(app)
        .patch(`/api/admin/users/${dummyUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(roleRes.status).toBe(200);
      expect(roleRes.body.user.role).toBe('admin');

      // Revert to user
      const revertRes = await request(app)
        .patch(`/api/admin/users/${dummyUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' });

      expect(revertRes.status).toBe(200);
      expect(revertRes.body.user.role).toBe('user');
    });

    it('should soft delete user and prevent deleted user login', async () => {
      const delRes = await request(app)
        .delete(`/api/admin/users/${dummyUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      const deletedUser = await User.findById(dummyUserId);
      expect(deletedUser.status).toBe('deleted');

      // Attempt login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: dummyUserEmail,
          password: 'Password123!',
        });

      expect(loginRes.status).toBe(401);
    });

    it('should fetch admin audit logs', async () => {
      const res = await request(app)
        .get('/api/admin/users/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      expect(res.body.logs[0].action).toBeDefined();
    });
  });

  describe('Admin Dashboard & Metrics API (/api/admin)', () => {
    it('should forbid regular users from accessing admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow admin user to access platform metrics and recommendation analytics', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.stats.totalUsers).toBeGreaterThanOrEqual(1);
      expect(res.body.stats.totalOrders).toBeGreaterThanOrEqual(1);
      expect(res.body.stats.totalRevenue).toBeGreaterThan(0);
      expect(res.body.stats.recommendationAnalytics).toBeDefined();
      expect(res.body.stats.recommendationAnalytics.impressions).toBeGreaterThanOrEqual(1);
    });
  });
});
