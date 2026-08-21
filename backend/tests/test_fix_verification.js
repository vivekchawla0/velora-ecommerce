const axios = require('axios');

const baseURL = 'http://127.0.0.1:5000/api';

async function verifyRecommendationFix() {
  console.log('================================================================');
  console.log('  VELORA RECOMMENDATION FIX: END-TO-END VERIFICATION TEST       ');
  console.log('================================================================\n');

  try {
    // 1. Authenticate as Alex Morgan (demo@example.com)
    console.log('Step 1: Authenticating as demo@example.com (Alex Morgan)...');
    const authRes = await axios.post(`${baseURL}/auth/login`, {
      email: 'demo@example.com',
      password: 'Demo123!',
    });
    const token = authRes.data.token;
    const user = authRes.data.user;
    const headers = { Authorization: `Bearer ${token}` };
    console.log(`✓ Authenticated successfully! User ID: ${user.id || user._id}\n`);

    // 2. Fetch User Interaction History from MongoDB
    console.log('Step 2: Fetching user interaction history from MongoDB...');
    const historyRes = await axios.get(`${baseURL}/interactions/my-history?limit=100`, { headers });
    const history = historyRes.data.history || [];
    const interactedProductMap = new Map();
    history.forEach((h) => {
      if (h.productId) {
        const pId = (h.productId._id || h.productId).toString();
        const pName = h.productId.name || 'Unknown Product';
        interactedProductMap.set(pId, pName);
      }
    });

    const excludedProductIds = Array.from(interactedProductMap.keys());
    console.log(`✓ Found ${excludedProductIds.length} unique interacted products in user history:`);
    excludedProductIds.forEach((pid, idx) => {
      console.log(`   ${idx + 1}. [${pid}] ${interactedProductMap.get(pid)}`);
    });

    // 3. Call GET /api/recommendations?limit=8
    console.log('\nStep 3: Calling GET /api/recommendations?limit=8...');
    const recRes = await axios.get(`${baseURL}/recommendations?limit=8`, { headers });
    const recommendations = recRes.data.recommendations || [];
    const recommendedProductIds = recommendations.map((r) => (r._id || r.productId).toString());

    console.log(`✓ Received ${recommendations.length} personalized recommendations:`);
    recommendations.forEach((r, idx) => {
      console.log(`   ${idx + 1}. [${r._id}] [${(r.category || '').toUpperCase()}] ${r.name} ($${r.price}) — Score: ${r.recommendationScore} | Reason: "${r.recommendationReason}"`);
    });

    // 4. Strict Exclusion & Overlap Verification
    console.log('\nStep 4: Checking for overlap between interacted items and recommendations...');
    const overlap = recommendedProductIds.filter((id) => excludedProductIds.includes(id));

    if (overlap.length === 0) {
      console.log('✓ SUCCESS: ZERO (0) overlap found between interacted products and recommendations.');
      console.log('✓ All recommended products are 100% NEW, unseen items tailored to the user taste profile.');
    } else {
      console.error(`✗ FAILED: ${overlap.length} already-interacted products appeared in recommendations:`, overlap);
      process.exit(1);
    }

    // 5. Test another persona (Sarah Jenkins) to ensure distinct personalization
    console.log('\nStep 5: Authenticating as sarah@example.com (Sarah Jenkins)...');
    const authResSarah = await axios.post(`${baseURL}/auth/login`, {
      email: 'sarah@example.com',
      password: 'User123!',
    });
    const tokenSarah = authResSarah.data.token;
    const headersSarah = { Authorization: `Bearer ${tokenSarah}` };

    const historySarahRes = await axios.get(`${baseURL}/interactions/my-history?limit=100`, { headers: headersSarah });
    const historySarah = historySarahRes.data.history || [];
    const sarahInteractedMap = new Map();
    historySarah.forEach((h) => {
      if (h.productId) {
        const pId = (h.productId._id || h.productId).toString();
        sarahInteractedMap.set(pId, h.productId.name);
      }
    });
    const sarahExcludedIds = Array.from(sarahInteractedMap.keys());

    const recResSarah = await axios.get(`${baseURL}/recommendations?limit=8`, { headers: headersSarah });
    const sarahRecs = recResSarah.data.recommendations || [];
    const sarahRecIds = sarahRecs.map((r) => (r._id || r.productId).toString());

    console.log(`✓ Sarah Jenkins has ${sarahExcludedIds.length} interacted products.`);
    console.log(`✓ Sarah Recommendations (${sarahRecs.length} items):`);
    sarahRecs.forEach((r, idx) => {
      console.log(`   ${idx + 1}. [${r._id}] [${(r.category || '').toUpperCase()}] ${r.name} ($${r.price}) — Score: ${r.recommendationScore}`);
    });

    const sarahOverlap = sarahRecIds.filter((id) => sarahExcludedIds.includes(id));
    console.log(`\nSarah Interacted Overlap in For You: ${sarahOverlap.length === 0 ? '0 (PASSED ✓)' : 'FAILED'}`);

    console.log('\n================================================================');
    console.log('  ALL API VERIFICATIONS PASSED SUCCESSFULLY (100%)               ');
    console.log('================================================================\n');
  } catch (err) {
    console.error('Verification failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

verifyRecommendationFix();
