import express from 'express';
import {
  generateSyntheticData,
  generateMultipleProfiles,
  clearSyntheticData,
  getDataStats,
} from '../controllers/dataGenerationController.js';

const router = express.Router();

/**
 * Data Generation Routes
 * Endpoints for generating and managing synthetic transaction data
 */

// POST: Generate synthetic data for a single user
// Body: { userId, profileType, transactionCount }
router.post('/generate', generateSyntheticData);

// POST: Generate synthetic data for multiple demo profiles
router.post('/generate-multi', generateMultipleProfiles);

// DELETE: Clear all transactions for a user
router.delete('/:userId', clearSyntheticData);

// GET: Get statistics about user's transaction data
router.get('/stats/:userId', getDataStats);

export default router;
