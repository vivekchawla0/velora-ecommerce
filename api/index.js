const app = require('../backend/src/app');
const { connectDB } = require('../backend/src/config/db');
const Product = require('../backend/src/models/Product');
const User = require('../backend/src/models/User');
const { runSeed } = require('../backend/src/scripts/seed');

let isSeeding = false;

module.exports = async (req, res) => {
    try {
        // 1. Ensure Database Connection
        await connectDB();

        // 2. Auto-seed if database is empty or core data missing
        const productCount = await Product.countDocuments();
        if (productCount === 0 && !isSeeding) {
            isSeeding = true;
            console.log('[Vercel Serverless] Product database is empty. Running initial catalog seed...');
            await runSeed({ silent: true });
            isSeeding = false;
        }
    } catch (error) {
        console.error('[Vercel Serverless Error] DB connection/seed error:', error.message);
        isSeeding = false;
    }

    // 3. Delegate request handling to Express app
    return app(req, res);
};
