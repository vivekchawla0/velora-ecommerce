const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Product = require('../models/Product');
const Interaction = require('../models/Interaction');
const Order = require('../models/Order');
const Review = require('../models/Review');
const RecommendationFeedback = require('../models/RecommendationFeedback');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/velora';

async function auditCatalog() {
  console.log('Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.\n');

  const products = await Product.find({}).lean();
  console.log(`Total products in database: ${products.length}`);

  // 1. Audit Images
  console.log('\n========================================');
  console.log('1. AUDITING PRODUCT IMAGES');
  console.log('========================================');

  const missingImageProducts = [];
  const invalidImageProducts = [];

  for (const p of products) {
    if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
      missingImageProducts.push({ id: p._id, name: p.name, category: p.category, reason: 'Empty or missing images array' });
    } else {
      const validUrls = p.images.filter(img => typeof img === 'string' && img.trim().length > 0 && (img.startsWith('http://') || img.startsWith('https://')));
      if (validUrls.length === 0) {
        missingImageProducts.push({ id: p._id, name: p.name, category: p.category, reason: 'No valid http/https URLs' });
      }
    }
  }

  console.log(`Products with missing or empty image field: ${missingImageProducts.length}`);
  if (missingImageProducts.length > 0) {
    missingImageProducts.forEach((p, idx) => {
      console.log(`  ${idx + 1}. [${p.id}] ${p.name} (${p.category}) - ${p.reason}`);
    });
  }

  // 2. Audit Duplicates
  console.log('\n========================================');
  console.log('2. AUDITING DUPLICATE PRODUCTS');
  console.log('========================================');

  // Group by normalized name
  const nameMap = new Map();
  // Group by SKU if exists
  const skuMap = new Map();

  for (const p of products) {
    const normName = (p.name || '').trim().toLowerCase();
    if (!nameMap.has(normName)) {
      nameMap.set(normName, []);
    }
    nameMap.get(normName).push(p);

    if (p.sku && p.sku.trim()) {
      const normSku = p.sku.trim().toUpperCase();
      if (!skuMap.has(normSku)) {
        skuMap.set(normSku, []);
      }
      skuMap.get(normSku).push(p);
    }
  }

  const nameDuplicates = [];
  for (const [name, list] of nameMap.entries()) {
    if (list.length > 1) {
      nameDuplicates.push({ name, count: list.length, items: list });
    }
  }

  const skuDuplicates = [];
  for (const [sku, list] of skuMap.entries()) {
    if (list.length > 1) {
      skuDuplicates.push({ sku, count: list.length, items: list });
    }
  }

  console.log(`Duplicate product name groups found: ${nameDuplicates.length}`);
  nameDuplicates.forEach((group, idx) => {
    console.log(`\nGroup ${idx + 1}: "${group.name}" (Count: ${group.count})`);
    group.items.forEach(item => {
      console.log(`  - ID: ${item._id} | SKU: ${item.sku} | Category: ${item.category} | Price: $${item.price} | Images: ${item.images?.length || 0}`);
    });
  });

  console.log(`\nDuplicate SKU groups found: ${skuDuplicates.length}`);
  skuDuplicates.forEach((group, idx) => {
    console.log(`\nSKU Group ${idx + 1}: "${group.sku}" (Count: ${group.count})`);
    group.items.forEach(item => {
      console.log(`  - ID: ${item._id} | Name: ${item.name} | Category: ${item.category} | Price: $${item.price}`);
    });
  });

  // 3. Audit image URL health (sample check or batch check)
  console.log('\n========================================');
  console.log('3. AUDITING IMAGE URL REACHABILITY');
  console.log('========================================');

  const uniqueImageUrls = new Set();
  products.forEach(p => {
    if (p.images && Array.isArray(p.images)) {
      p.images.forEach(img => {
        if (typeof img === 'string' && img.startsWith('http')) {
          uniqueImageUrls.add(img);
        }
      });
    }
  });

  console.log(`Total unique image URLs across catalog: ${uniqueImageUrls.size}`);
  
  // Test a batch of URLs to verify responsiveness
  const testUrls = Array.from(uniqueImageUrls).slice(0, 15);
  let reachableCount = 0;
  let brokenUrls = [];

  for (const url of testUrls) {
    try {
      const res = await axios.head(url, { timeout: 4000 });
      if (res.status >= 200 && res.status < 400) {
        reachableCount++;
      } else {
        brokenUrls.push({ url, status: res.status });
      }
    } catch (err) {
      brokenUrls.push({ url, error: err.message });
    }
  }

  console.log(`Sample tested 15 image URLs: ${reachableCount} reachable, ${brokenUrls.length} broken.`);
  if (brokenUrls.length > 0) {
    console.log('Broken URLs:', brokenUrls);
  }

  // 4. Check DB References
  console.log('\n========================================');
  console.log('4. AUDITING DATABASE REFERENCES');
  console.log('========================================');
  const interactionCount = await Interaction.countDocuments();
  const orderCount = await Order.countDocuments();
  const reviewCount = await Review.countDocuments();
  const feedbackCount = await RecommendationFeedback.countDocuments();
  const userCount = await User.countDocuments();

  console.log(`Interactions: ${interactionCount}`);
  console.log(`Orders: ${orderCount}`);
  console.log(`Reviews: ${reviewCount}`);
  console.log(`RecommendationFeedbacks: ${feedbackCount}`);
  console.log(`Users: ${userCount}`);

  await mongoose.disconnect();
}

auditCatalog().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
