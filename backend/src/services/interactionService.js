const axios = require('axios');
const Interaction = require('../models/Interaction');
const { INTERACTION_WEIGHTS } = require('../models/Interaction');

const RECOMMENDATION_SERVICE_URL =
  process.env.RECOMMENDATION_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Record a user-product interaction event
 * Ensures userId comes strictly from req.user (authenticated context)
 * Persists to MongoDB and asynchronously notifies the Python ML Recommendation Microservice
 */
const recordInteraction = async ({
  userId,
  productId,
  type,
  ratingValue,
  metadata = {},
}) => {
  if (!userId || !productId || !type) {
    throw new Error('userId, productId, and type are required to record interaction.');
  }

  let weight = INTERACTION_WEIGHTS[type] || 1.0;
  if (type === 'rating' && ratingValue) {
    weight = Number(ratingValue);
  }

  // 1. Save interaction in persistent MongoDB
  const interaction = await Interaction.create({
    userId,
    productId,
    type,
    weight,
    ratingValue: ratingValue ? Number(ratingValue) : undefined,
    metadata,
  });

  // 2. Asynchronously notify Python Recommendation Microservice in real time
  axios
    .post(
      `${RECOMMENDATION_SERVICE_URL}/interactions`,
      {
        user_id: userId.toString(),
        product_id: productId.toString(),
        interaction_type: type,
        weight: weight,
      },
      { timeout: 1500 }
    )
    .catch((err) => {
      // Non-blocking background log
      console.debug(`[ML Sync] Notice: Could not push live event to ML service: ${err.message}`);
    });

  return interaction;
};

module.exports = { recordInteraction };
