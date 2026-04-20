import express from 'express';
import AuditLog from '../models/AuditLog.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

/**
 * GET /api/audit-logs
 * Get all audit logs for a user (paginated)
 * Query: userId, limit, offset, decision, riskLevel, startDate, endDate
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { userId } = req.query;
    const { limit = 20, offset = 0, decision, riskLevel, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Build query
    const query = { userId };

    if (decision) {
      query.decision = decision;
    }
    if (riskLevel) {
      query.riskLevel = riskLevel;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await AuditLog.countDocuments(query);

    // Get paginated results
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('transactionId', 'amount location category timestamp')
      .lean();

    // Add decision metadata
    const DECISIONS = {
      APPROVE: { emoji: '✅', color: '#10b981' },
      CHALLENGE: { emoji: '🟡', color: '#f59e0b' },
      DECLINE: { emoji: '🚩', color: '#ef4444' },
      ESCALATE: { emoji: '⚠️', color: '#ef4444' },
      HOLD: { emoji: '⏸️', color: '#f59e0b' },
    };

    const enrichedLogs = logs.map((log) => ({
      ...log,
      decisionLabel: DECISIONS[log.decision],
    }));

    res.json({
      logs: enrichedLogs,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      stats: {
        total,
        byDecision: await AuditLog.collection.aggregate([
          { $match: { userId: require('mongoose').Types.ObjectId(userId) } },
          { $group: { _id: '$decision', count: { $sum: 1 } } },
        ]).toArray(),
        byRisk: await AuditLog.collection.aggregate([
          { $match: { userId: require('mongoose').Types.ObjectId(userId) } },
          { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
        ]).toArray(),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/audit-logs/:transactionId
 * Get specific audit log for a transaction
 */
export const getAuditLogByTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const auditLog = await AuditLog.findOne({ transactionId })
      .populate('transactionId')
      .populate('userId', 'email trustScore accountStatus');

    if (!auditLog) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json(auditLog);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/audit-logs/:transactionId/appeal
 * Submit an appeal for a transaction
 */
export const submitAppeal = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Appeal reason is required' });
    }

    // Find audit log
    const auditLog = await AuditLog.findOne({ transactionId });

    if (!auditLog) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    // Verify appeal is allowed
    if (!['CHALLENGE', 'DECLINE', 'ESCALATE'].includes(auditLog.decision)) {
      return res.status(400).json({ error: 'Cannot appeal this decision' });
    }

    // Update appeal status
    auditLog.appeal.appealed = true;
    auditLog.appeal.appealReason = reason;
    auditLog.appeal.appealStatus = 'PENDING';
    auditLog.appeal.appealSubmittedAt = new Date();

    await auditLog.save();

    // Update transaction
    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        'appeal.appealed': true,
        'appeal.appealReason': reason,
        'appeal.status': 'PENDING',
        'appeal.submittedAt': new Date(),
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Appeal submitted successfully',
      appealStatus: 'PENDING',
      transactionId,
    });
  } catch (error) {
    console.error('Error submitting appeal:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/audit-logs/:transactionId/appeal-status
 * Get appeal status for a transaction
 */
export const getAppealStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const auditLog = await AuditLog.findOne(
      { transactionId },
      'appeal decision systemMessage'
    );

    if (!auditLog) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json({
      transactionId,
      appealed: auditLog.appeal.appealed,
      appealStatus: auditLog.appeal.appealStatus,
      appealSubmittedAt: auditLog.appeal.appealSubmittedAt,
      appealReviewedAt: auditLog.appeal.appealReviewedAt,
      originalDecision: auditLog.decision,
    });
  } catch (error) {
    console.error('Error fetching appeal status:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/audit-logs/stats/:userId
 * Get audit statistics for a user
 */
export const getAuditStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await AuditLog.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalDecisions: { $sum: 1 },
          avgFraudScore: { $avg: '$fraudScore' },
          avgTrustScore: { $avg: '$trustScore' },
          approved: {
            $sum: { $cond: [{ $eq: ['$decision', 'APPROVE'] }, 1, 0] },
          },
          challenged: {
            $sum: { $cond: [{ $eq: ['$decision', 'CHALLENGE'] }, 1, 0] },
          },
          declined: {
            $sum: { $cond: [{ $eq: ['$decision', 'DECLINE'] }, 1, 0] },
          },
          escalated: {
            $sum: { $cond: [{ $eq: ['$decision', 'ESCALATE'] }, 1, 0] },
          },
          held: { $sum: { $cond: [{ $eq: ['$decision', 'HOLD'] }, 1, 0] } },
          lowRisk: {
            $sum: { $cond: [{ $eq: ['$riskLevel', 'LOW'] }, 1, 0] },
          },
          mediumRisk: {
            $sum: { $cond: [{ $eq: ['$riskLevel', 'MEDIUM'] }, 1, 0] },
          },
          highRisk: {
            $sum: { $cond: [{ $eq: ['$riskLevel', 'HIGH'] }, 1, 0] },
          },
          appealed: {
            $sum: { $cond: ['$appeal.appealed', 1, 0] },
          },
        },
      },
    ]);

    res.json(stats[0] || {});
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Register routes
router.get('/', getAuditLogs);
router.get('/stats/:userId', getAuditStats);
router.get('/:transactionId', getAuditLogByTransaction);
router.get('/:transactionId/appeal-status', getAppealStatus);
router.post('/:transactionId/appeal', submitAppeal);

export default router;
