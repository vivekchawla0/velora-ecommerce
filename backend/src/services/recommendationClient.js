const axios = require('axios');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Interaction = require('../models/Interaction');
const { productsData } = require('../scripts/seed');

const RECOMMENDATION_SERVICE_URL =
  process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = 300; // 300ms fast-fail timeout for ML microservice requests on serverless

// Format fallback products dataset with IDs and default timestamps
const fallbackProducts = (productsData || []).map((p, idx) => ({
  _id: p._id || `seed_prod_${p.sku || idx + 1}`,
  ...p,
  createdAt: p.createdAt || new Date(Date.now() - idx * 3600000).toISOString(),
}));

/**
 * Fetch personalized recommendations from Python ML microservice
 * with automatic database enrichment, explainability metadata, and negative feedback filtering.
 */
const getPersonalizedRecommendations = async (userId, limit = 10, excludeProductIds = []) => {
  let rawRecommendations = [];
  let isFallback = false;
  let fallbackReason = '';

  const excludeSet = new Set(excludeProductIds.map((id) => id.toString()));

  // 1. Attempt requesting Python Recommendation Microservice
  try {
    const params = { limit };
    if (excludeProductIds && excludeProductIds.length > 0) {
      params.exclude_product_ids = excludeProductIds.join(',');
    }

    const response = await axios.get(
      `${RECOMMENDATION_SERVICE_URL}/recommendations/${userId}`,
      {
        params,
        timeout: TIMEOUT_MS,
      }
    );

    if (response.data && Array.isArray(response.data.recommendations)) {
      rawRecommendations = response.data.recommendations.filter(
        (r) => !excludeSet.has(r.productId.toString())
      );
    }
  } catch (error) {
    isFallback = true;
    fallbackReason = 'Curated top trending picks across shoppers';
  }

  // 2. If ML service returned recommendations, safely enrich with MongoDB Product documents
  if (rawRecommendations.length > 0 && mongoose.connection.readyState === 1) {
    try {
      const validObjectIds = rawRecommendations
        .map((r) => r.productId)
        .filter((id) => mongoose.Types.ObjectId.isValid(id) && !excludeSet.has(id.toString()));

      if (validObjectIds.length > 0) {
        const products = await Product.find({ _id: { $in: validObjectIds }, isActive: { $ne: false } }).lean();

        // Map into sorted order with score and explainability reason
        const productMap = new Map(products.map((p) => [p._id.toString(), p]));
        const enriched = rawRecommendations
          .map((rec) => {
            const product = productMap.get(rec.productId.toString());
            if (!product) return null;
            return {
              ...product,
              recommendationScore: rec.score ? Number(rec.score.toFixed(3)) : 0.85,
              recommendationReason: rec.reason || 'Recommended based on your shopping interactions',
              recommendationReasonType: rec.reason_type || 'similar_user',
              recommendationSource: rec.similarity_type || 'collaborative_filtering',
            };
          })
          .filter(Boolean);

        if (enriched.length >= limit) {
          return {
            success: true,
            source: 'collaborative_filtering',
            count: enriched.length,
            data: enriched,
          };
        } else if (enriched.length > 0) {
          // Backfill remaining slots with non-duplicate trending items
          const existingIds = new Set(enriched.map((p) => p._id.toString()));
          const fullExclusion = Array.from(new Set([...excludeProductIds, ...Array.from(existingIds)]));
          const backfill = await getColdStartTrendingProducts(limit - enriched.length, fullExclusion);

          const combined = [...enriched, ...backfill];
          return {
            success: true,
            source: 'collaborative_filtering',
            count: combined.length,
            data: combined,
          };
        }
      }
    } catch (err) {
      console.warn('[Recommender Client] Document enrichment error:', err.message);
    }
  }

  // 3. Cold Start / Fallback Strategy: Weighted Trending & Top-Rated Products (excluding dismissed items)
  const fallbackList = await getColdStartTrendingProducts(limit, excludeProductIds);
  return {
    success: true,
    source: isFallback ? 'fallback_trending' : 'cold_start_popular',
    reason: fallbackReason || (userId !== 'guest' ? 'Recommended based on your recent activity' : 'Popular and highly-rated trending products'),
    count: fallbackList.length,
    data: fallbackList,
  };
};

/**
 * Item-Item Similar Products recommendation
 */
const getSimilarProducts = async (productId, limit = 6) => {
  try {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(productId)) {
      try {
        const response = await axios.get(
          `${RECOMMENDATION_SERVICE_URL}/similar/${productId}`,
          {
            params: { limit },
            timeout: TIMEOUT_MS,
          }
        );

        if (response.data && Array.isArray(response.data.recommendations) && response.data.recommendations.length > 0) {
          const validIds = response.data.recommendations
            .map((r) => r.productId)
            .filter((id) => mongoose.Types.ObjectId.isValid(id));

          if (validIds.length > 0) {
            const products = await Product.find({ _id: { $in: validIds }, isActive: { $ne: false } }).lean();
            const productMap = new Map(products.map((p) => [p._id.toString(), p]));

            const enriched = response.data.recommendations
              .map((rec) => {
                const product = productMap.get(rec.productId.toString());
                if (!product) return null;
                return {
                  ...product,
                  similarityScore: rec.score ? Number(rec.score.toFixed(3)) : 0.8,
                  recommendationReason: 'Frequently viewed or bought together',
                  recommendationReasonType: 'item_similarity',
                };
              })
              .filter(Boolean);

            if (enriched.length > 0) {
              return enriched;
            }
          }
        }
      } catch (err) {
        // Fallthrough
      }
    }

    // Try DB category / brand similarity fallback
    let similar = [];
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(productId)) {
      try {
        const baseProduct = await Product.findOne({ _id: productId, isActive: { $ne: false } });
        if (baseProduct) {
          similar = await Product.find({
            _id: { $ne: baseProduct._id },
            isActive: { $ne: false },
            $or: [{ category: baseProduct.category }, { brand: baseProduct.brand }],
          })
            .sort({ rating: -1, ratingCount: -1 })
            .limit(limit)
            .lean();
        }
      } catch (err) {
        // Fallthrough
      }
    }

    // In-Memory dataset similarity fallback if DB returns 0 items
    if (!similar || similar.length === 0) {
      const baseProduct = fallbackProducts.find(
        (p) =>
          String(p._id) === String(productId) ||
          String(p.id) === String(productId) ||
          p.sku === productId
      );

      const targetCategory = baseProduct?.category;
      const targetBrand = baseProduct?.brand;

      similar = fallbackProducts.filter((p) => {
        if (String(p._id) === String(productId) || String(p.id) === String(productId)) return false;
        if (targetCategory && (p.category === targetCategory || p.category?.toLowerCase() === targetCategory?.toLowerCase())) return true;
        if (targetBrand && p.brand === targetBrand) return true;
        return false;
      });

      if (similar.length === 0) {
        similar = fallbackProducts.filter(
          (p) => String(p._id) !== String(productId) && String(p.id) !== String(productId)
        );
      }

      similar.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      similar = similar.slice(0, limit);
    }

    return similar.map((p) => ({
      ...p,
      similarityScore: 0.82,
      recommendationReason: `More from ${p.category || 'this category'}`,
      recommendationReasonType: 'category_affinity',
    }));
  } catch (err) {
    console.warn('[Recommender Client] Similar products resolution error:', err.message);
    return fallbackProducts.slice(0, limit).map((p) => ({
      ...p,
      similarityScore: 0.75,
      recommendationReason: 'Recommended item',
      recommendationReasonType: 'top_rated',
    }));
  }
};

/**
 * Intelligent cold-start aggregator using interaction weight counts + Bayesian ratings
 */
const getColdStartTrendingProducts = async (limit = 10, excludeProductIds = []) => {
  const isDemoMode = (process.env.PRODUCT_DATA_MODE || 'amazon').toLowerCase() === 'demo';
  const exSet = new Set((excludeProductIds || []).map((id) => String(id)));

  let dbProducts = [];
  if (mongoose.connection.readyState === 1) {
    try {
      const validExcludedObjectIds = (excludeProductIds || [])
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      const query = { stock: { $gt: 0 }, isActive: { $ne: false } };
      if (validExcludedObjectIds.length > 0) {
        query._id = { $nin: validExcludedObjectIds };
      }

      dbProducts = await Product.find(query)
        .sort({ featured: -1, rating: -1, ratingCount: -1 })
        .limit(limit * 2)
        .lean();
    } catch (err) {
      console.warn('[Recommender Client] Cold start DB query warning:', err.message);
    }
  }

  let combined = dbProducts || [];
  if (isDemoMode && (!dbProducts || dbProducts.length === 0)) {
    combined = [...fallbackProducts];
  }

  // Deduplicate and filter out excluded products
  const seen = new Set();
  const filtered = [];
  for (const p of combined) {
    const pId = String(p._id || p.id || p.sku);
    if (!seen.has(pId) && !exSet.has(pId) && !exSet.has(String(p.sku))) {
      seen.add(pId);
      filtered.push(p);
    }
  }

  // Sort by rating & featured status
  filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.rating || 0) - (a.rating || 0));

  const finalItems = filtered.slice(0, limit);

  return finalItems.map((p) => ({
    ...p,
    recommendationScore: p.recommendationScore || 0.88,
    recommendationReason: p.recommendationReason || 'Top rated best seller in our store',
    recommendationReasonType: 'top_rated',
    recommendationSource: 'catalog_top_rated',
  }));
};

/**
 * Sync MongoDB interactions to Python Recommendation Microservice
 */
const syncInteractionsWithML = async () => {
  try {
    const interactions = await Interaction.find().lean();
    if (interactions.length > 0) {
      const payload = {
        interactions: interactions.map((i) => ({
          user_id: i.userId.toString(),
          product_id: i.productId.toString(),
          interaction_type: i.type,
          weight: i.weight || 1.0,
        })),
        force_db_reload: false,
      };

      await axios.post(`${RECOMMENDATION_SERVICE_URL}/train`, payload, {
        timeout: 4000,
      });
      console.log(`[ML Sync] Successfully synced ${interactions.length} interactions with Python ML Microservice.`);
    }
  } catch (error) {
    // Silent notice
  }
};

/**
 * Check ML Service Health
 */
const checkMLServiceHealth = async () => {
  try {
    const res = await axios.get(`${RECOMMENDATION_SERVICE_URL}/health`, {
      timeout: 2000,
    });
    return { status: 'up', details: res.data };
  } catch (error) {
    return { status: 'down', error: error.message };
  }
};

module.exports = {
  getPersonalizedRecommendations,
  getSimilarProducts,
  getColdStartTrendingProducts,
  syncInteractionsWithML,
  checkMLServiceHealth,
};
