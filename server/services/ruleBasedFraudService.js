/**
 * Rule-Based Fraud Service
 * Enforces deterministic business and regulatory rules
 * Layer 1 of the hybrid intelligence model
 *
 * Rules include:
 * - Regulatory compliance (AML, sanctions)
 * - Business policies (velocity caps, transaction limits)
 * - Risk tier differentiation
 * - Pattern-based fraud signatures
 */

export class RuleBasedFraudService {
  constructor(userModel, transactionModel) {
    this.User = userModel;
    this.Transaction = transactionModel;

    // Define all fraud rules
    this.rules = this._initializeRules();
  }

  /**
   * Evaluate transaction against all rules
   * Returns: { ruleScore, rulesApplied, blockedByRule, flaggedByRule, reviewRequired }
   */
  async evaluateRules(userId, transactionData, recentTransactions) {
    try {
      const user = await this.User.findById(userId);
      if (!user) throw new Error('User not found');

      const rulesApplied = [];
      let maxBlockScore = 0;
      let maxFlagScore = 0;
      let reviewRequired = false;

      // Evaluate each rule
      for (const rule of this.rules) {
        const result = this._evaluateRule(rule, transactionData, user, recentTransactions);
        if (result.triggered) {
          rulesApplied.push(result);

          // Track highest severity scores
          if (result.action === 'block') maxBlockScore = Math.max(maxBlockScore, result.score);
          if (result.action === 'flag') maxFlagScore = Math.max(maxFlagScore, result.score);
          if (result.action === 'review') reviewRequired = true;
        }
      }

      // Calculate composite rule score (0-1)
      const ruleScore = Math.min(1, maxBlockScore * 1.0 + maxFlagScore * 0.8);

      return {
        ruleScore: parseFloat(ruleScore.toFixed(3)),
        rulesApplied,
        blockedByRule: maxBlockScore > 0,
        flaggedByRule: maxFlagScore > 0,
        reviewRequired,
        ruleCount: rulesApplied.length,
      };
    } catch (error) {
      console.error('Rule evaluation error:', error);
      return {
        ruleScore: 0,
        rulesApplied: [],
        blockedByRule: false,
        flaggedByRule: false,
        reviewRequired: false,
        error: error.message,
      };
    }
  }

  // ============ PRIVATE: RULE EVALUATION ============

  /**
   * Evaluate a single rule
   */
  _evaluateRule(rule, transactionData, user, recentTransactions) {
    let triggered = false;
    let score = 0;
    let reason = '';

    switch (rule.id) {
      // Regulatory: AML Transaction Limit
      case 'AML_TRANSACTION_LIMIT':
        if (transactionData.amount > rule.params.threshold) {
          triggered = true;
          score = 1.0;
          reason = `Exceeds AML threshold of $${rule.params.threshold}`;
        }
        break;

      // Regulatory: Rapid Structuring (Multiple transactions adding up)
      case 'AML_RAPID_STRUCTURE':
        {
          const sum24h = recentTransactions
            .filter(
              (t) =>
                new Date() - new Date(t.timestamp) < 24 * 60 * 60 * 1000 &&
                t.amount >= rule.params.minAmount &&
                t.amount <= rule.params.maxAmount
            )
            .reduce((s, t) => s + t.amount, 0);

          if (sum24h + transactionData.amount >= rule.params.threshold) {
            triggered = true;
            score = 0.95;
            reason = `Pattern matching: ${recentTransactions.length} transactions in 24h totaling $${sum24h.toFixed(0)}`;
          }
        }
        break;

      // Velocity: Burst Fast (transactions per minute)
      case 'BURST_FAST':
        {
          const last60sec = recentTransactions.filter(
            (t) => new Date() - new Date(t.timestamp) < 60 * 1000
          );
          if (last60sec.length >= rule.params.threshold) {
            triggered = true;
            score = 0.9;
            reason = `${last60sec.length} transactions in 60 seconds`;
          }
        }
        break;

      // Velocity: Burst Moderate (transactions per hour)
      case 'BURST_MODERATE':
        {
          const lastHour = recentTransactions.filter(
            (t) => new Date() - new Date(t.timestamp) < 60 * 60 * 1000
          );
          if (lastHour.length >= rule.params.threshold) {
            triggered = true;
            score = 0.8;
            reason = `${lastHour.length} transactions in 1 hour (unusual burst pattern)`;
          }
        }
        break;

      // Time: Unusual Hour (2-5 AM)
      case 'UNUSUAL_HOUR':
        {
          const hour = new Date(transactionData.timestamp).getHours();
          if (rule.params.hours.includes(hour)) {
            triggered = true;
            score = 0.7;
            reason = `Transaction at ${hour}:00 - outside typical business hours`;
          }
        }
        break;

      // Time: Weekend After Hours
      case 'WEEKEND_AFTER_HOURS':
        {
          const date = new Date(transactionData.timestamp);
          const day = date.getDay();
          const hour = date.getHours();
          if ((day === 0 || day === 6) && (hour >= 22 || hour <= 6)) {
            triggered = true;
            score = 0.6;
            reason = `Weekend transaction outside business hours (${hour}:00)`;
          }
        }
        break;

      // Device: Multiple Devices Same Time
      case 'MULTIPLE_DEVICE_SAME_TIME':
        {
          const last30min = recentTransactions.filter(
            (t) => new Date() - new Date(t.timestamp) < 30 * 60 * 1000
          );
          const uniqueDevices = new Set(last30min.map((t) => t.deviceId));
          if (uniqueDevices.size >= rule.params.deviceCount) {
            triggered = true;
            score = 0.85;
            reason = `${uniqueDevices.size} different devices used in 30 minutes`;
          }
        }
        break;

      // Device: Device Velocity (device jumping locations)
      case 'DEVICE_VELOCITY':
        {
          if (recentTransactions.length > 0) {
            const lastTxn = recentTransactions[0];
            if (
              lastTxn.deviceId === transactionData.deviceId &&
              lastTxn.location !== transactionData.location
            ) {
              const timeDiffMin = (new Date() - new Date(lastTxn.timestamp)) / (1000 * 60);
              // Same device, different location in < 5 minutes = suspicious
              if (timeDiffMin < rule.params.minMinutesBetweenLocations) {
                triggered = true;
                score = 0.75;
                reason = `Device used in different location (${lastTxn.location} → ${transactionData.location}) in ${timeDiffMin.toFixed(0)} minutes`;
              }
            }
          }
        }
        break;

      // Location: Impossible Travel
      case 'IMPOSSIBLE_TRAVEL':
        {
          if (recentTransactions.length > 0) {
            const lastTxn = recentTransactions[0];
            if (lastTxn.location !== transactionData.location) {
              const timeDiffMin = (new Date() - new Date(lastTxn.timestamp)) / (1000 * 60);
              // Simplified: if location changed within 5 min, assume impossible
              if (timeDiffMin < rule.params.minMinutes) {
                triggered = true;
                score = 0.95;
                reason = `Impossible travel: Location changed (${lastTxn.location} → ${transactionData.location}) in ${timeDiffMin.toFixed(0)} minutes`;
              }
            }
          }
        }
        break;

      // Location: International First Time
      case 'INTERNATIONAL_FIRST_TIME':
        {
          const userProfile = user.behavioralProfile || {};
          const usualCountries = userProfile.usualCountries || ['US'];
          const isInternational = !usualCountries.includes(this._extractCountry(transactionData.location));

          if (isInternational && !this._hasTransactionFromLocation(recentTransactions, transactionData.location)) {
            triggered = true;
            score = 0.7;
            reason = `First international transaction from ${transactionData.location}`;
          }
        }
        break;

      // Amount: 5x User Average
      case 'AMOUNT_5X_USER_AVERAGE':
        {
          const userProfile = user.behavioralProfile || {};
          const avgAmount = userProfile.amountStats?.mean || transactionData.amount;
          if (avgAmount > 0 && transactionData.amount > avgAmount * rule.params.multiplier) {
            triggered = true;
            score = 0.75;
            reason = `Amount is ${(transactionData.amount / avgAmount).toFixed(1)}x your average ($${transactionData.amount} vs avg $${avgAmount.toFixed(0)})`;
          }
        }
        break;

      // Amount: 10x User Average
      case 'AMOUNT_10X_USER_AVERAGE':
        {
          const userProfile = user.behavioralProfile || {};
          const avgAmount = userProfile.amountStats?.mean || transactionData.amount;
          if (avgAmount > 0 && transactionData.amount > avgAmount * rule.params.multiplier) {
            triggered = true;
            score = 0.95;
            reason = `Extremely high amount: ${(transactionData.amount / avgAmount).toFixed(1)}x your average`;
          }
        }
        break;

      // Behavior: Sudden Burst of New Devices
      case 'DEVICE_BURST':
        {
          const last24h = recentTransactions.filter(
            (t) => new Date() - new Date(t.timestamp) < 24 * 60 * 60 * 1000
          );
          const newDeviceCount = last24h.filter((t) => !user.devices?.find((d) => d.deviceId === t.deviceId)).length;

          if (newDeviceCount >= rule.params.threshold) {
            triggered = true;
            score = 0.8;
            reason = `${newDeviceCount} new devices used in 24 hours`;
          }
        }
        break;

      // Behavior: Location Burst (multiple new locations)
      case 'LOCATION_BURST':
        {
          const last24h = recentTransactions.filter(
            (t) => new Date() - new Date(t.timestamp) < 24 * 60 * 60 * 1000
          );
          const newLocationCount = last24h.filter(
            (t) => !user.locationHistory?.find((l) => l.location.toLowerCase() === t.location.toLowerCase())
          ).length;

          if (newLocationCount >= rule.params.threshold) {
            triggered = true;
            score = 0.75;
            reason = `${newLocationCount} transactions from new locations in 24 hours`;
          }
        }
        break;

      // Account: Newly Created Account
      case 'NEW_ACCOUNT':
        {
          const userProfile = user.behavioralProfile || {};
          const accountAgeDays = userProfile.accountAge || 0;
          if (accountAgeDays < rule.params.maxDays) {
            triggered = true;
            score = 0.6;
            reason = `New account (${accountAgeDays} days old) - higher risk for fraud`;
          }
        }
        break;

      // Account: Previous Fraud Flags
      case 'PREVIOUS_FRAUD_ACTIVITY':
        {
          const userProfile = user.behavioralProfile || {};
          if (userProfile.fraudFlagCount >= rule.params.threshold) {
            triggered = true;
            score = 0.8;
            reason = `Account has ${userProfile.fraudFlagCount} previous fraud flags`;
          }
        }
        break;
    }

    return {
      triggered,
      ruleId: rule.id,
      ruleName: rule.name,
      action: rule.action,
      score: score > 0 ? score : 0,
      reason,
      priority: rule.priority,
      confidence: score > 0 ? 0.95 : 0, // Rules have high confidence when triggered
    };
  }

  // ============ PRIVATE: RULE INITIALIZATION ============

  /**
   * Initialize all fraud detection rules
   */
  _initializeRules() {
    return [
      // ===== REGULATORY RULES (Priority 1) =====
      {
        id: 'AML_TRANSACTION_LIMIT',
        name: 'AML Transaction Limit',
        description: 'Transaction exceeds AML reporting threshold',
        action: 'block',
        priority: 1,
        enabled: true,
        params: { threshold: 10000 },
      },
      {
        id: 'AML_RAPID_STRUCTURE',
        name: 'AML Structuring Detection',
        description: 'Multiple transactions appear to structure amounts',
        action: 'flag',
        priority: 1,
        enabled: true,
        params: { minAmount: 5000, maxAmount: 10000, threshold: 15000 },
      },

      // ===== VELOCITY RULES (Priority 2) =====
      {
        id: 'BURST_FAST',
        name: 'Rapid Transaction Burst',
        description: 'Multiple transactions within 60 seconds',
        action: 'flag',
        priority: 2,
        enabled: true,
        params: { threshold: 5 },
      },
      {
        id: 'BURST_MODERATE',
        name: 'Burst Pattern Detection',
        description: 'Multiple transactions within 1 hour',
        action: 'flag',
        priority: 2,
        enabled: true,
        params: { threshold: 15 },
      },

      // ===== TIME-BASED RULES (Priority 3) =====
      {
        id: 'UNUSUAL_HOUR',
        name: 'Unusual Transaction Hour',
        description: 'Transaction during unusual hours (2-5 AM)',
        action: 'flag',
        priority: 3,
        enabled: true,
        params: { hours: [2, 3, 4, 5] },
      },
      {
        id: 'WEEKEND_AFTER_HOURS',
        name: 'Weekend After Hours',
        description: 'Transaction on weekend outside business hours',
        action: 'flag',
        priority: 3,
        enabled: true,
        params: {},
      },

      // ===== DEVICE RULES (Priority 4) =====
      {
        id: 'MULTIPLE_DEVICE_SAME_TIME',
        name: 'Multiple Devices Same Time',
        description: 'Multiple different devices used within 30 minutes',
        action: 'flag',
        priority: 4,
        enabled: true,
        params: { deviceCount: 4 },
      },
      {
        id: 'DEVICE_VELOCITY',
        name: 'Device Velocity Check',
        description: 'Same device used in different location very quickly',
        action: 'flag',
        priority: 4,
        enabled: true,
        params: { minMinutesBetweenLocations: 5 },
      },
      {
        id: 'DEVICE_BURST',
        name: 'Device Burst Pattern',
        description: 'Multiple new devices used in short time',
        action: 'flag',
        priority: 4,
        enabled: true,
        params: { threshold: 3 },
      },

      // ===== LOCATION RULES (Priority 4) =====
      {
        id: 'IMPOSSIBLE_TRAVEL',
        name: 'Impossible Travel Detection',
        description: 'Location changed impossibly quickly',
        action: 'block',
        priority: 1,
        enabled: true,
        params: { minMinutes: 5 },
      },
      {
        id: 'INTERNATIONAL_FIRST_TIME',
        name: 'First International Transaction',
        description: 'First time transaction from international location',
        action: 'flag',
        priority: 4,
        enabled: true,
        params: {},
      },
      {
        id: 'LOCATION_BURST',
        name: 'Location Burst Pattern',
        description: 'Multiple new locations in short time',
        action: 'flag',
        priority: 4,
        enabled: true,
        params: { threshold: 3 },
      },

      // ===== AMOUNT RULES (Priority 5) =====
      {
        id: 'AMOUNT_5X_USER_AVERAGE',
        name: 'Amount 5x Average',
        description: 'Transaction is 5x user average amount',
        action: 'flag',
        priority: 5,
        enabled: true,
        params: { multiplier: 5 },
      },
      {
        id: 'AMOUNT_10X_USER_AVERAGE',
        name: 'Amount 10x Average',
        description: 'Transaction is 10x user average amount',
        action: 'block',
        priority: 1,
        enabled: true,
        params: { multiplier: 10 },
      },

      // ===== ACCOUNT RULES (Priority 3) =====
      {
        id: 'NEW_ACCOUNT',
        name: 'New Account Flag',
        description: 'Account is newly created (<30 days)',
        action: 'flag',
        priority: 3,
        enabled: true,
        params: { maxDays: 30 },
      },
      {
        id: 'PREVIOUS_FRAUD_ACTIVITY',
        name: 'Previous Fraud Activity',
        description: 'Account has history of fraudulent activity',
        action: 'flag',
        priority: 2,
        enabled: true,
        params: { threshold: 2 },
      },
    ];
  }

  // ============ PRIVATE: HELPER METHODS ============

  _extractCountry(location) {
    // Simplified: assume last word is country
    // In production, use geolocation API
    const parts = location.split(',');
    return parts[parts.length - 1]?.trim() || 'US';
  }

  _hasTransactionFromLocation(transactions, location) {
    return transactions.some(
      (t) => t.location.toLowerCase() === location.toLowerCase()
    );
  }
}

export default RuleBasedFraudService;
