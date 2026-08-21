const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Product = require('../models/Product');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/velora';

async function deepCatalogCheck() {
  await mongoose.connect(MONGO_URI);
  const products = await Product.find({}).lean();
  console.log(`Auditing ${products.length} products...\n`);

  // 1. Check every single image URL across all products
  const urlToProducts = new Map();
  for (const p of products) {
    if (!p.images || p.images.length === 0) {
      console.log(`[NO IMAGE] Product ${p._id} "${p.name}" has 0 images!`);
    } else {
      for (const img of p.images) {
        if (!urlToProducts.has(img)) {
          urlToProducts.set(img, []);
        }
        urlToProducts.get(img).push({ id: p._id, name: p.name, category: p.category });
      }
    }
  }

  console.log(`Checking reachability for all ${urlToProducts.size} unique image URLs...`);
  const brokenUrls = [];
  const validUrls = [];

  for (const [url, prods] of urlToProducts.entries()) {
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 6000,
        responseType: 'stream',
      });
      if (res.status >= 200 && res.status < 400) {
        validUrls.push(url);
      } else {
        brokenUrls.push({ url, status: res.status, prods });
      }
    } catch (err) {
      brokenUrls.push({ url, error: err.message, prods });
    }
  }

  console.log(`\nImage URL Reachability Results:`);
  console.log(`  - Valid & Reachable: ${validUrls.length}`);
  console.log(`  - Broken/Timed out: ${brokenUrls.length}`);
  if (brokenUrls.length > 0) {
    brokenUrls.forEach((b, i) => {
      console.log(`    ${i + 1}. URL: ${b.url}`);
      console.log(`       Error: ${b.error || b.status}`);
      console.log(`       Used by: ${b.prods.map(p => p.name).join(', ')}`);
    });
  }

  // 2. Check for image reuse across completely different categories
  console.log('\nChecking for cross-category image reuse...');
  let crossCategoryReuse = 0;
  for (const [url, prods] of urlToProducts.entries()) {
    const categories = new Set(prods.map(p => p.category));
    if (categories.size > 1) {
      crossCategoryReuse++;
      console.log(`[Cross-Category Reuse] URL: ${url}`);
      console.log(`  Categories: ${Array.from(categories).join(', ')}`);
      console.log(`  Products: ${prods.map(p => `"${p.name}" (${p.category})`).join(' | ')}\n`);
    }
  }
  console.log(`Total cross-category image reuse instances: ${crossCategoryReuse}`);

  // 3. Check for Fuzzy Duplicates
  console.log('\nChecking for near-identical duplicate products...');
  function tokenize(str) {
    return new Set(str.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean));
  }

  function jaccardSimilarity(setA, setB) {
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }

  const potentialDuplicates = [];
  for (let i = 0; i < products.length; i++) {
    const p1 = products[i];
    const tokens1 = tokenize(p1.name);
    for (let j = i + 1; j < products.length; j++) {
      const p2 = products[j];
      const tokens2 = tokenize(p2.name);
      const sim = jaccardSimilarity(tokens1, tokens2);
      if (sim >= 0.85 && p1.category === p2.category) {
        potentialDuplicates.push({ p1, p2, similarity: sim });
      }
    }
  }

  console.log(`Potential near-duplicate products: ${potentialDuplicates.length}`);
  potentialDuplicates.forEach((d, idx) => {
    console.log(`\nMatch ${idx + 1} (Sim: ${(d.similarity * 100).toFixed(1)}%):`);
    console.log(`  A: [${d.p1._id}] ${d.p1.name} (SKU: ${d.p1.sku}, $${d.p1.price})`);
    console.log(`  B: [${d.p2._id}] ${d.p2.name} (SKU: ${d.p2.sku}, $${d.p2.price})`);
  });

  await mongoose.disconnect();
}

deepCatalogCheck().catch(err => {
  console.error('Deep check error:', err);
  process.exit(1);
});
