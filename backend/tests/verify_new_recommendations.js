const axios = require('axios');

async function testNewProductRecommendations() {
  const baseURL = 'http://127.0.0.1:5000/api';
  console.log('================================================================');
  console.log('  TESTING REAL RECOMMENDATIONS PIPELINE (STRICT NEW ITEMS ONLY)');
  console.log('================================================================\n');

  try {
    // 1. Create a brand-new test user
    const randomSuffix = Math.floor(Math.random() * 100000);
    const testUserEmail = `rec_test_user_${randomSuffix}@example.com`;
    const registerRes = await axios.post(`${baseURL}/auth/register`, {
      name: `Recommendation Tester ${randomSuffix}`,
      email: testUserEmail,
      password: 'TestPassword123!',
    });

    const token = registerRes.data.token;
    const userId = registerRes.data.user.id || registerRes.data.user._id;
    const headers = { Authorization: `Bearer ${token}` };
    console.log(`[Step 1] Created fresh test user: ${testUserEmail} (ID: ${userId})`);

    // 2. Fetch Cold-Start recommendations for brand-new user
    const coldStartRes = await axios.get(`${baseURL}/recommendations?limit=6`, { headers });
    const coldStartRecs = coldStartRes.data.recommendations;
    console.log(`\n[Step 2] Cold Start Recommendations (User has 0 interactions):`);
    console.log(`         Strategy / Source: ${coldStartRes.data.source}`);
    console.log(`         Reason: ${coldStartRes.data.reason}`);
    console.log(`         Items count: ${coldStartRecs.length}`);
    coldStartRecs.slice(0, 3).forEach((r, i) => {
      console.log(`           ${i + 1}. ${r.name} (${r.category}) - Score: ${r.recommendationScore}`);
    });

    // 3. Find 3 products in catalog to interact with:
    //    Product A (Workspace), Product B (Audio/Electronics), Product C (Gaming)
    const [workspaceProds, audioProds, gamingProds] = await Promise.all([
      axios.get(`${baseURL}/products?category=workspace&limit=3`),
      axios.get(`${baseURL}/products?category=audio&limit=3`),
      axios.get(`${baseURL}/products?category=gaming&limit=3`),
    ]);

    const prodA = workspaceProds.data.products[0];
    const prodB = audioProds.data.products[0];
    const prodC = (gamingProds.data.products.length > 0 ? gamingProds.data.products[0] : workspaceProds.data.products[1]);

    const idA = prodA._id.toString();
    const idB = prodB._id.toString();
    const idC = prodC._id.toString();
    const interactedIds = new Set([idA, idB, idC]);

    console.log('\n[Step 3] User interacts with 3 specific products:');
    console.log(`         Product A (VIEW):     ${prodA.name} [ID: ${idA}] (${prodA.category})`);
    console.log(`         Product B (FAVORITE): ${prodB.name} [ID: ${idB}] (${prodB.category})`);
    console.log(`         Product C (CART):     ${prodC.name} [ID: ${idC}] (${prodC.category})`);

    // Perform the 3 interactions
    await axios.post(`${baseURL}/interactions`, { productId: idA, type: 'view' }, { headers });
    await axios.post(`${baseURL}/wishlist/${idB}`, {}, { headers });
    await axios.post(`${baseURL}/cart/add`, { productId: idC, quantity: 1 }, { headers });

    // 4. Request recommendations after the 3 interactions
    await new Promise((resolve) => setTimeout(resolve, 800)); // wait for async ML propagation
    const recsRes1 = await axios.get(`${baseURL}/recommendations?limit=6`, { headers });
    const recs1 = recsRes1.data.recommendations;
    const recIds1 = recs1.map((r) => (r._id || r.productId).toString());

    console.log('\n[Step 4] Recommendations generated after interactions on A, B, C:');
    console.log(`         Count: ${recs1.length}`);
    recs1.forEach((r, i) => {
      console.log(`           ${i + 1}. ${r.name} (${r.category}) - Score: ${r.recommendationScore} | Reason: ${r.recommendationReason}`);
    });

    // VERIFICATION: Check that A, B, C are NOT in recommendations
    const hasA = recIds1.includes(idA);
    const hasB = recIds1.includes(idB);
    const hasC = recIds1.includes(idC);

    console.log('\n[Step 5] Strict Filtering Verification:');
    console.log(`         Product A (Viewed) in recommendations?   ${hasA ? 'FAIL (Included)' : 'PASS (Excluded) ✓'}`);
    console.log(`         Product B (Favorited) in recommendations? ${hasB ? 'FAIL (Included)' : 'PASS (Excluded) ✓'}`);
    console.log(`         Product C (Carted) in recommendations?    ${hasC ? 'FAIL (Included)' : 'PASS (Excluded) ✓'}`);

    if (hasA || hasB || hasC) {
      throw new Error('FAILURE: Interacted products appeared in For You recommendations!');
    }

    // 6. User now interacts with a new category: Fitness (Product D)
    const fitnessProds = await axios.get(`${baseURL}/products?category=fitness&limit=3`);
    const prodD = fitnessProds.data.products[0];
    const idD = prodD._id.toString();
    interactedIds.add(idD);

    console.log(`\n[Step 6] User now interacts with Product D in FITNESS category:`);
    console.log(`         Product D (VIEW + WISHLIST): ${prodD.name} [ID: ${idD}]`);

    await axios.post(`${baseURL}/interactions`, { productId: idD, type: 'view' }, { headers });
    await axios.post(`${baseURL}/wishlist/${idD}`, {}, { headers });

    // 7. Request updated recommendations after interacting with Product D
    await new Promise((resolve) => setTimeout(resolve, 800));
    const recsRes2 = await axios.get(`${baseURL}/recommendations?limit=6`, { headers });
    const recs2 = recsRes2.data.recommendations;
    const recIds2 = recs2.map((r) => (r._id || r.productId).toString());

    console.log('\n[Step 7] Recommendations generated after Fitness interaction:');
    recs2.forEach((r, i) => {
      console.log(`           ${i + 1}. ${r.name} (${r.category}) - Score: ${r.recommendationScore} | Reason: ${r.recommendationReason}`);
    });

    const hasD = recIds2.includes(idD);
    const hasAnyInteracted = recs2.some((r) => interactedIds.has((r._id || r.productId).toString()));

    console.log('\n[Step 8] Second Interaction Verification:');
    console.log(`         Product D in recommendations?            ${hasD ? 'FAIL (Included)' : 'PASS (Excluded) ✓'}`);
    console.log(`         ANY interacted item (A, B, C, D) in recs? ${hasAnyInteracted ? 'FAIL (Included)' : 'PASS (None included) ✓'}`);

    if (hasAnyInteracted) {
      throw new Error('FAILURE: An interacted product was returned in recommendations!');
    }

    console.log('\n================================================================');
    console.log('  ALL CHECKS PASSED: RECOMMENDATIONS RETURN 100% NEW PRODUCTS!  ');
    console.log('================================================================\n');
  } catch (err) {
    console.error('Error during recommendation verification:', err.response?.data || err.message);
    process.exit(1);
  }
}

testNewProductRecommendations();
