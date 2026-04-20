import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    // Transaction reference
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Decision information
    decision: {
      type: String,
      enum: ['APPROVE', 'CHALLENGE', 'DECLINE', 'ESCALATE', 'HOLD'],
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true,
    },
    trustLevel: {
      type: String,
      enum: ['TRUSTED', 'MODERATE_RISK', 'HIGH_RISK'],
      required: true,
    },

    // Scores and confidence
    fraudScore: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    trustScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8,
    },

    // User-facing message
    systemMessage: String,

    // Decision reasoning
    reasoning: {
      fraudReason: String,
      trustReason: String,
      ruleReason: String,
      decisionFactors: [String], // Array of factors that influenced decision
    },

    // Transaction details at time of decision
    transactionDetails: {
      amount: Number,
      location: String,
      timestamp: Date,
      category: String,
      deviceName: String,
      deviceId: String,
    },

    // User context at time of decision
    userContext: {
      accountAge: Number, // in days
      accountStatus: String,
      fraudHistoryCount: Number,
      historicalFlagRate: Number,
      behavioralProfile: {
        typicalAmountMean: Number,
        typicalAmountStdDev: Number,
        primaryLocations: [String],
      },
    },

    // Decision engine metadata
    decisionEngine: {
      version: String,
      model: String,
      updatedAt: Date,
    },

    // Appeal tracking
    appeal: {
      appealed: {
        type: Boolean,
        default: false,
      },
      appealReason: String,
      appealStatus: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'],
      },
      appealSubmittedAt: Date,
      appealReviewedBy: String,
      appealReviewedAt: Date,
      appealNotes: String,
    },

    // Action tracking
    action: {
      taken: {
        type: String,
        enum: ['APPROVED', 'CHALLENGED', 'DECLINED', 'ESCALATED', 'HELD'],
      },
      approvalTime: Date,
      manualReview: Boolean,
      reviewedBy: String,
      notes: String,
    },

    // Outcome tracking (post-transaction)
    outcome: {
      actuallyFraud: Boolean, // confirmed after time
      falsePositive: Boolean,
      confirmedAt: Date,
      confirmedBy: String,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for common queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ decision: 1, createdAt: -1 });
auditLogSchema.index({ riskLevel: 1 });
auditLogSchema.index({ transactionId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
