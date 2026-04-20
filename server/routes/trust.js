import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import User from '../models/User.js';
import { TrustScoreService } from '../services/trustScoreService.js';
import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';

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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch actual AuditLogs to get historical trust scores for the user
    const auditLogs = await AuditLog.find({
      userId: req.user.userId,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: 1 });

    const history = [];

    // Always generate exactly 30 days to maintain the "3 days gap" layout on frontend X-axis
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      history.push({
        _dateStr: dateStr,
        date: d,
        score: null, // default empty
        reason: 'No activity',
      });
    }

    if (auditLogs.length > 0) {
      const dailyScores = {};
      auditLogs.forEach(log => {
        const d = new Date(log.createdAt);
        const dateStr = d.toISOString().split('T')[0];
        dailyScores[dateStr] = log.trustScore;
      });

      // Fill real-time scores starting from the first recorded transaction
      let lastKnownScore = null;
      history.forEach(day => {
        if (dailyScores[day._dateStr] !== undefined) {
          lastKnownScore = dailyScores[day._dateStr];
          day.score = lastKnownScore;
          day.reason = 'Transaction processed';
        } else if (lastKnownScore !== null) {
          // Carry forward the score if there were no transactions on this day
          day.score = lastKnownScore;
          day.reason = 'Carried forward';
        }
      });
      
      // Ensure today's score ends accurately if missing from today's dailyScores
      const todayStr = new Date().toISOString().split('T')[0];
      const todayItem = history[history.length - 1];
      if (todayItem._dateStr === todayStr && todayItem.score === null) {
         if (lastKnownScore !== null) {
             todayItem.score = user.trustScore;
             todayItem.reason = 'Current score';
         }
      }
    } else {
      // If user didn't have any transactions, return an empty array (chart empty)
      return res.json({ success: true, data: { history: [] } });
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
