const express = require('express');
const router = express.Router();
const {
  createInteraction,
  getMyInteractions,
  getInteractionSummary,
  getTrainingData,
} = require('../controllers/interactionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createInteraction);
router.get('/my-history', protect, getMyInteractions);
router.get('/summary', protect, getInteractionSummary);
router.get('/training-data', getTrainingData); // Internal/ML access

module.exports = router;
