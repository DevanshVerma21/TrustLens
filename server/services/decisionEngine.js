/**
 * Decision Engine Service
 * Centralized logic for all transaction decisions
 * Implements 5-tier decision system: APPROVE / CHALLENGE / DECLINE / ESCALATE / HOLD
 */

export class DecisionEngine {
  // Decision types with metadata
  static DECISIONS = {
    APPROVE: {
      code: 1,
      label: 'Approved',
      emoji: '✅',
      icon: 'CheckCircle',
      color: '#10b981',
      bgColor: 'bg-green-50',
      textColor: 'text-green-900',
      borderColor: 'border-green-200',
      requiresVerification: false,
      canAppeal: false,
    },
    CHALLENGE: {
      code: 2,
      label: 'Review Required',
      emoji: '🟡',
      icon: 'AlertCircle',
      color: '#f59e0b',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-900',
      borderColor: 'border-amber-200',
      requiresVerification: true,
      canAppeal: true,
    },
    DECLINE: {
      code: 3,
      label: 'Declined',
      emoji: '🚩',
      icon: 'XCircle',
      color: '#ef4444',
      bgColor: 'bg-red-50',
      textColor: 'text-red-900',
      borderColor: 'border-red-200',
      requiresVerification: false,
      canAppeal: true,
    },
    ESCALATE: {
      code: 4,
      label: 'Escalated',
      emoji: '⚠️',
      icon: 'AlertTriangle',
      color: '#ef4444',
      bgColor: 'bg-red-50',
      textColor: 'text-red-900',
      borderColor: 'border-red-200',
      requiresVerification: true,
      canAppeal: true,
    },
    HOLD: {
      code: 5,
      label: 'On Hold',
      emoji: '⏸️',
      icon: 'Pause',
      color: '#f59e0b',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-900',
      borderColor: 'border-amber-200',
      requiresVerification: true,
      canAppeal: false,
    },
  };

  // Risk levels
  static RISK_LEVELS = {
    LOW: {
      label: 'Low Risk',
      emoji: '🟢',
      icon: 'TrendingDown',
      color: '#10b981',
      threshold: { minFraud: 0, maxFraud: 0.35 },
    },
    MEDIUM: {
      label: 'Medium Risk',
      emoji: '🟡',
      icon: 'AlertCircle',
      color: '#f59e0b',
      threshold: { minFraud: 0.35, maxFraud: 0.65 },
    },
    HIGH: {
      label: 'High Risk',
      emoji: '🔴',
      icon: 'AlertTriangle',
      color: '#ef4444',
      threshold: { minFraud: 0.65, maxFraud: 1.0 },
    },
  };

  // Trust score categories
  static TRUST_CATEGORIES = {
    TRUSTED: {
      label: 'Trusted',
      emoji: '✅',
      threshold: { min: 80, max: 100 },
    },
    MODERATE_RISK: {
      label: 'Moderate Risk',
      emoji: '⚠️',
      threshold: { min: 50, max: 79 },
    },
    HIGH_RISK: {
      label: 'High Risk',
      emoji: '🚨',
      threshold: { min: 0, max: 49 },
    },
  };

  // System messages (user-facing)
  static MESSAGES = {
    APPROVE_AUTO: '✅ Transaction approved - matches your normal behavior',
    APPROVE_TRUSTED: '✅ Transaction approved - trusted account',
    APPROVE_LOW_RISK: '✅ Transaction approved - low risk profile',

    CHALLENGE_AMOUNT: '🟡 Transaction requires verification - unusual amount',
    CHALLENGE_LOCATION: '🟡 Transaction requires verification - new location',
    CHALLENGE_TIME: '🟡 Transaction requires verification - unusual time',
    CHALLENGE_DEVICE: '🟡 Transaction requires verification - new device',
    CHALLENGE_COMBINED: '🟡 Transaction requires verification - multiple unusual factors',
    CHALLENGE_PATTERN: '🟡 Transaction requires verification - unusual pattern',

    DECLINE_HIGH_RISK: '🚩 Transaction blocked - high fraud risk detected',
    DECLINE_RULE: '🚩 Transaction blocked - violates security policy',
    DECLINE_AML: '🚩 Transaction blocked - exceeds transaction limit',
    DECLINE_SUSPICIOUS: '🚩 Transaction blocked - suspicious activity detected',
    DECLINE_VELOCITY: '🚩 Transaction blocked - too many transactions',

    ESCALATE_REVIEW: '⚠️ Transaction escalated for manual review',
    ESCALATE_VELOCITY: '⚠️ Transaction escalated - unusual velocity pattern',
    ESCALATE_NEW_ACCOUNT: '⚠️ Transaction escalated - new account requires review',

    HOLD_VERIFICATION: '⏸️ Transaction held pending verification',
    HOLD_KYC: '⏸️ Transaction held - account verification required',
  };

  /**
   * Make decision on a transaction
   */
  static async makeDecision(transaction, fraudAnalysis, user) {
    // Pre-decision checks
    if (!user) {
      return {
        decision: this.DECISIONS.DECLINE.code,
        decisionName: 'DECLINE',
        riskLevel: 'HIGH',
        trustLevel: 'HIGH_RISK',
        systemMessage: this.MESSAGES.DECLINE_SUSPICIOUS,
        reasoning: {
          fraudReason: 'User not found',
          trustReason: 'Unable to verify user',
          decisionFactors: ['User Verification Failed'],
        },
      };
    }

    // Determine risk level
    const riskLevel = this._getRiskLevel(fraudAnalysis.fraudScore);

    // Determine trust level
    const trustLevel = this._getTrustLevel(user.trustScore || 85);

    // Make decision based on fraud score + trust score
    let decision = this._makeDecisionLogic(
      fraudAnalysis.fraudScore,
      user.trustScore || 85,
      user.accountStatus,
      fraudAnalysis
    );

    // Get system message
    const systemMessage = this._getSystemMessage(decision, fraudAnalysis, riskLevel);

    // Get reasoning
    const reasoning = this._getReasoningDetails(fraudAnalysis, user, decision);

    return {
      decision,
      decisionName: this._getDecisionName(decision),
      riskLevel,
      trustLevel,
      fraudScore: fraudAnalysis.fraudScore,
      confidence: fraudAnalysis.confidence?.overall || 0.8,
      trustScore: user.trustScore || 85,
      systemMessage,
      reasoning,
      canAppeal: this.DECISIONS[this._getDecisionName(decision)].canAppeal,
      requiresVerification: this.DECISIONS[this._getDecisionName(decision)].requiresVerification,
      timestamp: new Date(),
      decisionEngineVersion: '1.0.0',
      model: 'hybrid-intelligence-v3',
    };
  }

  /**
   * Determine risk level from fraud score
   */
  static _getRiskLevel(fraudScore) {
    if (fraudScore < 0.35) return 'LOW';
    if (fraudScore < 0.65) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Determine trust level from trust score
   */
  static _getTrustLevel(trustScore) {
    if (trustScore >= 80) return 'TRUSTED';
    if (trustScore >= 50) return 'MODERATE_RISK';
    return 'HIGH_RISK';
  }

  /**
   * Core decision logic (5-tier)
   */
  static _makeDecisionLogic(fraudScore, trustScore, accountStatus, fraudAnalysis) {
    // Check account status first
    if (accountStatus === 'suspended') {
      return 'DECLINE';
    }
    if (accountStatus === 'flagged') {
      return 'ESCALATE';
    }

    // High fraud score → DECLINE
    if (fraudScore > 0.85) {
      return 'DECLINE';
    }

    // Medium-high fraud score → CHALLENGE
    if (fraudScore > 0.65) {
      if (trustScore > 80) {
        return 'CHALLENGE'; // APPROVE for very trusted users
      }
      if (trustScore < 50) {
        return 'ESCALATE'; // ESCALATE for risky users
      }
      return 'CHALLENGE';
    }

    // Medium fraud score with low trust → CHALLENGE or ESCALATE
    if (fraudScore > 0.35 && trustScore < 50) {
      return 'ESCALATE';
    }
    if (fraudScore > 0.35) {
      return 'CHALLENGE';
    }

    // Low fraud + high trust → APPROVE
    if (fraudScore < 0.35 && trustScore > 80) {
      return 'APPROVE';
    }

    // Low fraud + medium trust → APPROVE
    if (fraudScore < 0.35 && trustScore > 50) {
      return 'APPROVE';
    }

    // Low fraud + low trust → CHALLENGE
    if (fraudScore < 0.35 && trustScore <= 50) {
      return 'CHALLENGE';
    }

    // Default: APPROVE for very low fraud
    if (fraudScore < 0.2) {
      return 'APPROVE';
    }

    return 'CHALLENGE';
  }

  /**
   * Get decision name from code
   */
  static _getDecisionName(decisionCode) {
    for (const [name, config] of Object.entries(this.DECISIONS)) {
      if (config.code === decisionCode || name === decisionCode) {
        return name;
      }
    }
    return 'APPROVE';
  }

  /**
   * Select appropriate system message
   */
  static _getSystemMessage(decision, fraudAnalysis, riskLevel) {
    const decisionName = this._getDecisionName(decision);

    switch (decisionName) {
      case 'APPROVE':
        return this.MESSAGES.APPROVE_AUTO;

      case 'CHALLENGE':
        if (fraudAnalysis.riskFactors?.amountRisk > 0.7) {
          return this.MESSAGES.CHALLENGE_AMOUNT;
        }
        if (fraudAnalysis.riskFactors?.locationRisk > 0.7) {
          return this.MESSAGES.CHALLENGE_LOCATION;
        }
        if (fraudAnalysis.riskFactors?.timeRisk > 0.7) {
          return this.MESSAGES.CHALLENGE_TIME;
        }
        if (fraudAnalysis.riskFactors?.deviceRisk > 0.7) {
          return this.MESSAGES.CHALLENGE_DEVICE;
        }
        return this.MESSAGES.CHALLENGE_COMBINED;

      case 'DECLINE':
        if (fraudAnalysis.ruleAnalysis?.blockedByRule) {
          return this.MESSAGES.DECLINE_RULE;
        }
        return this.MESSAGES.DECLINE_HIGH_RISK;

      case 'ESCALATE':
        return this.MESSAGES.ESCALATE_REVIEW;

      case 'HOLD':
        return this.MESSAGES.HOLD_VERIFICATION;

      default:
        return this.MESSAGES.APPROVE_AUTO;
    }
  }

  /**
   * Build reasoning details
   */
  static _getReasoningDetails(fraudAnalysis, user, decision) {
    const decisionName = this._getDecisionName(decision);
    const factors = [];

    // Collect decision factors
    if (fraudAnalysis.riskFactors?.amountRisk > 0.5) {
      factors.push('Unusual Amount');
    }
    if (fraudAnalysis.riskFactors?.locationRisk > 0.5) {
      factors.push('New Location');
    }
    if (fraudAnalysis.riskFactors?.timeRisk > 0.5) {
      factors.push('Unusual Time');
    }
    if (fraudAnalysis.riskFactors?.deviceRisk > 0.5) {
      factors.push('New Device');
    }
    if (fraudAnalysis.riskFactors?.frequencyRisk > 0.5) {
      factors.push('High Velocity');
    }
    if (fraudAnalysis.ruleAnalysis?.flaggedByRule) {
      factors.push('Rule Trigger');
    }

    return {
      fraudReason: fraudAnalysis.fraudScore > 0.6 ? 'Fraud indicators detected' : 'Low fraud risk',
      trustReason:
        user.trustScore > 80
          ? 'Trusted account'
          : user.trustScore > 50
            ? 'Moderate trust level'
            : 'New or risky account',
      ruleReason: fraudAnalysis.ruleAnalysis?.flaggedByRule
        ? `Rule(s) triggered: ${fraudAnalysis.ruleAnalysis.rulesApplied
            ?.map((r) => r.ruleId)
            .join(', ')}`
        : 'No rule violations',
      decisionFactors: factors.length > 0 ? factors : ['Normal Activity'],
    };
  }

  /**
   * Calculate transaction impact on trust score
   */
  static calculateTrustImpact(decision, fraudScore) {
    const decisionName = this._getDecisionName(decision);

    switch (decisionName) {
      case 'APPROVE':
        return fraudScore < 0.2 ? 1 : 0; // Small boost for very clean transactions
      case 'CHALLENGE':
        return -2; // Minor penalty
      case 'DECLINE':
        return -5; // Significant penalty
      case 'ESCALATE':
        return -4; // Moderate penalty
      case 'HOLD':
        return -3; // Minor penalty
      default:
        return 0;
    }
  }
}

export default DecisionEngine;
