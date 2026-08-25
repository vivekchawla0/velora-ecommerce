const app = require('../backend/src/app');
const { connectDB } = require('../backend/src/config/db');
const Product = require('../backend/src/models/Product');
const User = require('../backend/src/models/User');
const { runSeed } = require('../backend/src/scripts/seed');

let isSeeded = false;

module.exports = async (req, res) => {
  try {
    // 1. Ensure Database Connection
    await connectDB();

    // 2. Auto-seed if database is empty or core data missing
    if (!isSeeded) {
      const productCount = await Product.countDocuments();
      const userCount = await User.countDocuments();
      if (productCount === 0 || userCount === 0) {
        console.log('[Vercel Serverless] Seeding initial products and user accounts...');
        await runSeed({ silent: true });
      }
      isSeeded = true;
    }
  } catch (error) {
    console.error('[Vercel Serverless Error] DB connection/seed error:', error.message);
  }

  // 3. Delegate request handling to Express app
  return app(req, res);
};
