import express from 'express';
import {
  submitTransaction,
  getUserTransactions,
  getTrustScore,
  getFraudLog,
} from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';
import { transactionRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { submitTransactionSchema } from '../validators/transactionSchemas.js';

const router = express.Router();

// All transaction routes require a valid JWT
router.use(authenticate);

// POST /api/transactions — submit for fraud detection
router.post(
  '/',
  transactionRateLimiter,
  validate(submitTransactionSchema),
  submitTransaction
);

// GET /api/transactions/user/:userId
router.get('/user/:userId', getUserTransactions);

// GET /api/transactions/trust-score/:userId
router.get('/trust-score/:userId', getTrustScore);

// GET /api/transactions/fraud-log/:transactionId
router.get('/fraud-log/:transactionId', getFraudLog);

export default router;
