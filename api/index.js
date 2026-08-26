const app = require('../backend/src/app');
const { connectDB } = require('../backend/src/config/db');

module.exports = async (req, res) => {
  try {
    // 1. Normalize Vercel Serverless Function rewritten URL path
    if (req.url && !req.url.startsWith('/api')) {
      req.url = `/api${req.url}`;
    }

    // 2. Ensure Database Connection
    await connectDB();
  } catch (error) {
    console.error('[Vercel Serverless Error]', error.message);
  }

  // 3. Delegate request handling to Express app
  return app(req, res);
};
