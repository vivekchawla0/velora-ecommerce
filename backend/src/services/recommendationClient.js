const axios = require('axios');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Interaction = require('../models/Interaction');

const RECOMMENDATION_SERVICE_URL =
  process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT_MS = 3000; // 3-second timeout for ML microservice requests

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
    console.warn(
      `[Recommender Client] Python microservice unavailable (${error.message}). Using intelligent fallback.`
    );
    isFallback = true;
    fallbackReason = 'ML service unreachable - fallback to trending popularity';
  }

  // 2. If ML service returned recommendations, safely enrich with MongoDB Product documents
  if (rawRecommendations.length > 0) {
    const validObjectIds = rawRecommendations
      .map((r) => r.productId)
      .filter((id) => mongoose.Types.ObjectId.isValid(id) && !excludeSet.has(id.toString()));

    if (validObjectIds.length > 0) {
      const products = await Product.find({ _id: { $in: validObjectIds } }).lean();

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
  }

  // 3. Cold Start / Fallback Strategy: Weighted Trending & Top-Rated Products (excluding dismissed items)
  const fallbackProducts = await getColdStartTrendingProducts(limit, excludeProductIds);
  return {
    success: true,
    source: isFallback ? 'fallback_trending' : 'cold_start_popular',
    reason: fallbackReason || (userId !== 'guest' ? 'Recommended based on your recent activity' : 'Popular and highly-rated trending products'),
    count: fallbackProducts.length,
    data: fallbackProducts,
  };
};

/**
 * Item-Item Similar Products recommendation
 */
const getSimilarProducts = async (productId, limit = 6) => {
  try {
    if (mongoose.Types.ObjectId.isValid(productId)) {
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
          const products = await Product.find({ _id: { $in: validIds } }).lean();
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
    }
  } catch (err) {
    // Fall through to category-based similarity fallback
  }

  // Fallback to Category and Tag similarity
  if (!mongoose.Types.ObjectId.isValid(productId)) return [];

  const baseProduct = await Product.findById(productId);
  if (!baseProduct) return [];

  const similar = await Product.find({
    _id: { $ne: baseProduct._id },
    $or: [{ category: baseProduct.category }, { brand: baseProduct.brand }],
  })
    .sort({ rating: -1, ratingCount: -1 })
    .limit(limit)
    .lean();

  return similar.map((p) => ({
    ...p,
    similarityScore: 0.75,
    recommendationReason: `More from ${p.category}`,
    recommendationReasonType: 'category_affinity',
  }));
};

/**
 * Intelligent cold-start aggregator using interaction weight counts + Bayesian ratings
 */
const getColdStartTrendingProducts = async (limit = 10, excludeProductIds = []) => {
  const excludedObjectIds = excludeProductIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  try {
    const matchStage = excludedObjectIds.length > 0 ? { productId: { $nin: excludedObjectIds } } : {};

    const topInteracted = await Interaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$productId',
          totalScore: { $sum: '$weight' },
          interactionCount: { $sum: 1 },
        },
      },
      { $sort: { totalScore: -1 } },
      { $limit: limit },
    ]);

    if (topInteracted.length >= 4) {
      const validIds = topInteracted
        .map((i) => i._id)
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (validIds.length > 0) {
        const products = await Product.find({ _id: { $in: validIds } }).lean();
        const productMap = new Map(products.map((p) => [p._id.toString(), p]));

        const results = topInteracted
          .map((item) => {
            const prod = productMap.get(item._id.toString());
            if (!prod) return null;
            return {
              ...prod,
              recommendationScore: 0.9,
              recommendationReason: 'Trending popular choice among shoppers',
              recommendationReasonType: 'cold_start_popular',
              recommendationSource: 'popularity_weight',
            };
          })
          .filter(Boolean);

        if (results.length > 0) return results;
      }
    }
  } catch (err) {
    console.debug('Cold start interaction agg error:', err.message);
  }

  // Pure product catalog fallback by rating & featured flag
  const query = { stock: { $gt: 0 } };
  if (excludedObjectIds.length > 0) {
    query._id = { $nin: excludedObjectIds };
  }

  const fallback = await Product.find(query)
    .sort({ featured: -1, rating: -1, ratingCount: -1 })
    .limit(limit)
    .lean();

  return fallback.map((p) => ({
    ...p,
    recommendationScore: 0.85,
    recommendationReason: 'Top rated best seller in our store',
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
    console.warn(`[ML Sync] Notice: Could not sync with ML microservice: ${error.message}`);
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
