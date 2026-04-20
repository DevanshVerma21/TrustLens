import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import User from '../models/User.js';
import { TrustScoreService } from '../services/trustScoreService.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();
const trustScoreService = new TrustScoreService(User, Transaction);

// GET: Current trust score and breakdown (protected)
router.get('/score', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get factors affecting score
    const recentTransactions = await Transaction.find({
      userId: req.user.userId,
      timestamp: {
        $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      },
    }).limit(50);

    const factors = [
      {
        name: 'Recent Activity',
        weight: 25,
        description: `${recentTransactions.length} transactions in last 90 days`,
      },
      {
        name: 'Account Age',
        weight: 15,
        description: `Account created ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'recently'}`,
      },
      {
        name: 'Risk Level',
        weight: 10,
        description: `Currently ${user.riskLevel || 'low'}`,
      },
      {
        name: 'Account Status',
        weight: 10,
        description: `Status: ${user.accountStatus || 'active'}`,
      },
    ];

    res.json({
      success: true,
      data: {
        trustScore: user.trustScore || 50,
        riskLevel: user.riskLevel || 'low',
        factors,
        lastUpdated: user.updatedAt || new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET: Trust score history for chart (protected)
router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get trust history (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const history = (user.trustHistory || []).filter((h) => new Date(h.date) >= thirtyDaysAgo);

    // If no history, return current score
    if (history.length === 0) {
      history.push({
        date: new Date(),
        score: user.trustScore || 50,
        reason: 'Initial score',
      });
    }

    res.json({
      success: true,
      data: {
        history: history.map((h) => ({
          date: h.date,
          score: h.score,
          reason: h.reason,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET: Factors affecting trust score (protected)
router.get('/factors', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const recentTransactions = await Transaction.find({
      userId: req.user.userId,
      timestamp: {
        $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    });

    const flaggedCount = recentTransactions.filter((t) => t.isFlagged).length;
    const avgFraudScore = recentTransactions.length
      ? recentTransactions.reduce((sum, t) => sum + t.fraudScore, 0) / recentTransactions.length
      : 0;

    const factors = [
      {
        name: 'Fraud Risk',
        weight: -Math.round(avgFraudScore * 40),
        impact: 'negative',
        description: `Avg fraud score: ${(avgFraudScore * 100).toFixed(0)}%`,
      },
      {
        name: 'Flagged Transactions',
        weight: -flaggedCount * 5,
        impact: 'negative',
        description: `${flaggedCount} flagged transaction(s)`,
      },
      {
        name: 'Account Consistency',
        weight: 10,
        impact: 'positive',
        description: 'Consistent device and location usage',
      },
      {
        name: 'Account Status',
        weight: user.accountStatus === 'active' ? 8 : -15,
        impact: user.accountStatus === 'active' ? 'positive' : 'negative',
        description: `Account is ${user.accountStatus || 'active'}`,
      },
    ];

    res.json({
      success: true,
      data: {
        factors: factors.filter((f) => f.weight !== 0),
        summary: {
          currentScore: user.trustScore || 50,
          riskLevel: user.riskLevel || 'low',
          improvementTips: [
            'Use consistent devices for transactions',
            'Maintain regular transaction patterns',
            'Avoid unusual locations and amounts',
          ],
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
