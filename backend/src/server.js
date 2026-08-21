const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend .env or root .env
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = require('./app');
const { connectDB } = require('./config/db');
const Product = require('./models/Product');
const { runSeed } = require('./scripts/seed');
const { syncInteractionsWithML } = require('./services/recommendationClient');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Auto-seed if database is empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('[Server] Database is empty. Running automatic seed data generator...');
      await runSeed({ silent: true });
    }

    // 3. Sync interactions with ML microservice
    await syncInteractionsWithML();

    // 4. Start Express HTTP Server
    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  🚀 VELORA Backend API Server Running`);
      console.log(`  ✨ Personalized Shopping, Reimagined.`);
      console.log(`  🌐 Port: http://localhost:${PORT}`);
      console.log(`  📊 Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  🔗 ML Recommender URL: ${process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8000'}`);
      console.log(`====================================================`);
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('[Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(`[Server Error] Startup failed: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
