const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const ML_BASE = 'http://localhost:8000';

async function runCatalogVerification() {
  console.log('====================================================');
  console.log('  VELORA CATALOG EXPANSION VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Checks
    console.log('--- 1. Health Checks ---');
    const healthRes = await axios.get(`${API_BASE}/health`);
    assert(healthRes.status === 200 && healthRes.data.status === 'healthy', 'Backend Health API is healthy');
    const mlHealthRes = await axios.get(`${ML_BASE}/health`);
    assert(mlHealthRes.status === 200 && mlHealthRes.data.status === 'healthy', 'Python ML Recommender is healthy');

    // 2. Total Products Count
    console.log('\n--- 2. Total Products Count ---');
    const totalProdRes = await axios.get(`${API_BASE}/products?limit=300`);
    const totalCount = totalProdRes.data.total;
    assert(totalCount >= 219, `Total products in catalog is ${totalCount} (>= 219 expected)`);

    // 3. Category Breakdown (Verify >= 20 products per target category)
    console.log('\n--- 3. Category Breakdown Verification ---');
    const targetCategories = [
      { slug: 'electronics', min: 20, label: 'Electronics' },
      { slug: 'fashion', min: 20, label: 'Fashion' },
      { slug: 'home-living', min: 20, label: 'Home & Living' },
      { slug: 'beauty', min: 20, label: 'Beauty & Personal Care' },
      { slug: 'sports-fitness', min: 20, label: 'Sports & Fitness' },
      { slug: 'accessories', min: 20, label: 'Accessories' },
      { slug: 'gaming', min: 20, label: 'Gaming' },
      { slug: 'books-learning', min: 20, label: 'Books & Learning' },
      { slug: 'travel', min: 20, label: 'Travel' },
      { slug: 'workspace', min: 20, label: 'Office & Workspace' },
    ];

    for (const cat of targetCategories) {
      const catRes = await axios.get(`${API_BASE}/products?category=${cat.slug}&limit=50`);
      const catCount = catRes.data.total;
      assert(catCount >= cat.min, `${cat.label} has ${catCount} products (>= ${cat.min} expected)`);
    }

    // 4. Search Functionality
    console.log('\n--- 4. Search Functionality ---');
    const search1 = await axios.get(`${API_BASE}/products?q=Mechanical`);
    assert(search1.data.products.length > 0, `Search for 'Mechanical' returned ${search1.data.products.length} products`);

    const search2 = await axios.get(`${API_BASE}/products?q=TitanTech`);
    assert(search2.data.products.length > 0, `Search for brand 'TitanTech' returned ${search2.data.products.length} products`);

    const search3 = await axios.get(`${API_BASE}/products?q=Kubernetes`);
    assert(search3.data.products.length > 0, `Search for tag/term 'Kubernetes' returned ${search3.data.products.length} products`);

    // 5. Price & Rating Filtering + Sorting + Pagination
    console.log('\n--- 5. Filters, Sorting & Pagination ---');
    const priceFilterRes = await axios.get(`${API_BASE}/products?minPrice=50&maxPrice=150&limit=10`);
    const allInRange = priceFilterRes.data.products.every(p => p.price >= 50 && p.price <= 150);
    assert(allInRange && priceFilterRes.data.products.length > 0, `Price range filter (50-150) returned ${priceFilterRes.data.products.length} matching products`);

    const ratingFilterRes = await axios.get(`${API_BASE}/products?minRating=4.8&limit=10`);
    const allHighRating = ratingFilterRes.data.products.every(p => p.rating >= 4.8);
    assert(allHighRating, `Rating filter (>= 4.8) verified on all ${ratingFilterRes.data.products.length} returned items`);

    const sortAscRes = await axios.get(`${API_BASE}/products?sort=price_asc&limit=5`);
    const isSortedAsc = sortAscRes.data.products[0].price <= sortAscRes.data.products[1].price;
    assert(isSortedAsc, `Price ascending sort verified (${sortAscRes.data.products[0].price} <= ${sortAscRes.data.products[1].price})`);

    const page2Res = await axios.get(`${API_BASE}/products?page=2&limit=12`);
    assert(page2Res.data.page === 2 && page2Res.data.products.length === 12, `Pagination page 2 returned 12 products`);

    // 6. User Recommendations & Cluster Affinities
    console.log('\n--- 6. Recommendation Engine Verification ---');
    // Login as Alex Morgan (Tech user)
    const alexLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'demo@example.com',
      password: 'Demo123!',
    });
    const alexToken = alexLogin.data.token;
    const alexRecs = await axios.get(`${API_BASE}/recommendations?limit=6`, {
      headers: { Authorization: `Bearer ${alexToken}` },
    });
    assert(alexRecs.data.recommendations && alexRecs.data.recommendations.length > 0, `Alex (Tech User) received ${alexRecs.data.recommendations.length} personalized recommendations`);

    // Login as Sarah Jenkins (Fashion & Beauty user)
    const sarahLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'sarah@example.com',
      password: 'User123!',
    });
    const sarahToken = sarahLogin.data.token;
    const sarahRecs = await axios.get(`${API_BASE}/recommendations?limit=6`, {
      headers: { Authorization: `Bearer ${sarahToken}` },
    });
    assert(sarahRecs.data.recommendations && sarahRecs.data.recommendations.length > 0, `Sarah (Fashion & Beauty) received ${sarahRecs.data.recommendations.length} personalized recommendations`);

    // Cold-start user recommendations (unauthenticated)
    const coldStartRecs = await axios.get(`${API_BASE}/recommendations?limit=6`);
    assert(coldStartRecs.data.recommendations && coldStartRecs.data.recommendations.length > 0, `Cold-start guest received ${coldStartRecs.data.recommendations.length} trending recommendations`);

    // 7. Admin Product & User Management Access
    console.log('\n--- 7. Admin Access Verification ---');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123!',
    });
    const adminToken = adminLogin.data.token;
    const adminStats = await axios.get(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminStats.status === 200 && adminStats.data.stats.totalProducts >= 219, `Admin stats reports totalProducts = ${adminStats.data.stats.totalProducts}`);

    console.log('\n====================================================');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Verification error:', err.response?.data || err.message);
    process.exit(1);
  }
}

runCatalogVerification();
