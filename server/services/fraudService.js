/**
 * Fraud Detection Service
 * Hybrid Intelligence Model: Rules + Statistical Anomalies + Confidence Scoring
 *
 * Three-tier system:
 * 1. Rule-Based Engine: Deterministic policies and regulatory compliance
 * 2. Anomaly Detection: Statistical analysis (Isolation Forest, LOF, Z-score)
 * 3. Confidence Scoring: Bayesian probability calibration
 */

import AnomalyDetectionService from './anomalyDetectionService.js';
import RuleBasedFraudService from './ruleBasedFraudService.js';
import ConfidenceScoringService from './confidenceScoringService.js';
import ProfileCalculator from '../utils/profileCalculator.js';

export class FraudService {
  constructor(userModel, transactionModel) {
    this.User = userModel;
    this.Transaction = transactionModel;
    this.ruleService = new RuleBasedFraudService(userModel, transactionModel);
    this.profileCalculator = ProfileCalculator;
  }

  /**
   * Calculate comprehensive fraud score using all three layers
   * Returns: Complete fraud assessment with confidence, rules, anomalies, explanations
   */
  async calculateFraudScore(userId, transactionData) {
    try {
      const user = await this.User.findById(userId);
      if (!user) throw new Error('User not found');

      // Get recent transaction history
      const recentTransactions = await this.Transaction.find({
        userId,
        timestamp: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      }).sort({ timestamp: -1 });

      // ===== LAYER 1: RULE-BASED EVALUATION =====
      const ruleAnalysis = await this.ruleService.evaluateRules(
        userId,
        transactionData,
        recentTransactions
      );

      // ===== LAYER 2: ANOMALY DETECTION =====
      const amounts = recentTransactions.map((t) => t.amount);
      const amountResult = AnomalyDetectionService.detectAmountAnomaly(transactionData.amount, amounts);
      const locationResult = AnomalyDetectionService.detectLocationAnomaly(
        transactionData.location,
        user.locationHistory,
        recentTransactions
      );
      const timeResult = AnomalyDetectionService.detectTimingAnomaly(
        transactionData.timestamp || new Date(),
        recentTransactions
      );
      const deviceResult = AnomalyDetectionService.detectDeviceAnomaly(
        transactionData.deviceId,
        user.devices,
        recentTransactions,
        transactionData.location
      );
      const frequencyResult = AnomalyDetectionService.detectFrequencyAnomaly(recentTransactions);

      // Extract anomaly scores with safety
      const amountRisk = this._safeExtract(amountResult?.anomalyScore, 0.1);
      const locationRisk = this._safeExtract(locationResult?.anomalyScore, 0.1);
      const timeRisk = this._safeExtract(timeResult?.anomalyScore, 0.1);
      const deviceRisk = this._safeExtract(deviceResult?.anomalyScore, 0.1);
      const frequencyRisk = this._safeExtract(frequencyResult?.anomalyScore, 0.1);

      // Ensemble anomaly score
      let anomalyScore =
        amountRisk * 0.3 + locationRisk * 0.25 + timeRisk * 0.15 + deviceRisk * 0.2 + frequencyRisk * 0.1;
      anomalyScore = Math.min(1, Math.max(0, anomalyScore));

      // ===== LAYER 3: CONFIDENCE SCORING (Bayesian) =====
      const userProfile = user.behavioralProfile;
      const confidenceResult = ConfidenceScoringService.calculateConfidenceScore(
        ruleAnalysis.ruleScore,
        {
          amount: amountRisk,
          location: locationRisk,
          time: timeRisk,
          device: deviceRisk,
          frequency: frequencyRisk,
        },
        userProfile
      );

      // ===== FINAL FRAUD SCORE =====
      let finalFraudScore = confidenceResult.fraudScore;

      // If rules are triggered with block action, increase score
      if (ruleAnalysis.blockedByRule) {
        finalFraudScore = Math.min(1, finalFraudScore * 1.2 + 0.1);
      }

      // If rules are triggered with flag action, increase score
      if (ruleAnalysis.flaggedByRule) {
        finalFraudScore = Math.min(1, finalFraudScore * 1.1 + 0.05);
      }

      finalFraudScore = Math.min(1, Math.max(0, finalFraudScore));

      // ===== DECISION LOGIC =====
      const threshold = this._getAdaptiveThreshold(user);
      const isFlagged = finalFraudScore > threshold || ruleAnalysis.blockedByRule;

      return {
        fraudScore: parseFloat(finalFraudScore.toFixed(3)),
        confidence: confidenceResult.confidence,
        bayesianProbability: confidenceResult.bayesianProbability,
        calibratedAccuracy: confidenceResult.calibratedAccuracy,
        confidenceLevel: confidenceResult.confidenceLevel,
        isFlagged,
        threshold: parseFloat(threshold.toFixed(3)),

        // Layer details
        riskFactors: {
          amountRisk,
          locationRisk,
          timeRisk,
          deviceRisk,
          frequencyRisk,
        },

        // Rule evaluation details
        ruleAnalysis: {
          ruleScore: ruleAnalysis.ruleScore,
          rulesApplied: ruleAnalysis.rulesApplied,
          blockedByRule: ruleAnalysis.blockedByRule,
          flaggedByRule: ruleAnalysis.flaggedByRule,
          reviewRequired: ruleAnalysis.reviewRequired,
        },

        // Anomaly detection details
        anomalyDetails: {
          amountScore: amountResult,
          locationScore: locationResult,
          timeScore: timeResult,
          deviceScore: deviceResult,
          frequencyScore: frequencyResult,
        },

        // User context
        userContext: {
          lastTransactionAmount: recentTransactions[0]?.amount,
          lastTransactionLocation: recentTransactions[0]?.location,
          accountAge: user.behavioralProfile?.accountAge,
          deviceCount: user.devices?.length || 0,
          locationCount: user.locationHistory?.length || 0,
        },
      };
    } catch (error) {
      console.error('Error calculating fraud score:', error);
      // Return safe default on error
      return {
        fraudScore: 0.1,
        confidence: { overall: 0.5, perFactor: {} },
        bayesianProbability: 0.1,
        calibratedAccuracy: { expectedPrecision: 0.5, expectedRecall: 0.5 },
        isFlagged: false,
        threshold: 0.6,
        error: error.message,
      };
    }
  }

  // ============ PRIVATE: HELPER METHODS ============

  /**
   * Safe extraction with type checking and defaults
   */
  _safeExtract(value, defaultValue = 0.1) {
    if (typeof value !== 'number' || isNaN(value)) return defaultValue;
    return Math.min(1, Math.max(0, value));
  }

  /**
   * Get adaptive fraud detection threshold based on user profile
   * Higher risk users get higher thresholds (harder to flag)
   * Lower trust score = higher threshold
   */
  _getAdaptiveThreshold(user) {
    const trustScore = user.trustScore || 85;
    const accountAge = user.behavioralProfile?.accountAge || 0;
    const fraudFlagRate = user.behavioralProfile?.fraudFlagRate || 0;

    // Base threshold: 0.6
    let threshold = 0.6;

    // Trust score adjustment
    if (trustScore < 40) threshold = 0.50; // Risky users: lower threshold
    else if (trustScore < 60) threshold = 0.55;
    else if (trustScore > 90) threshold = 0.70; // Trusted users: higher threshold

    // Account age adjustment
    if (accountAge < 30) threshold = Math.max(threshold, 0.55); // New accounts: stricter
    if (accountAge > 365 * 2) threshold = Math.min(threshold, 0.65); // Old accounts: more lenient

    // History of fraud adjustment
    if (fraudFlagRate > 0.05) threshold = Math.max(threshold, 0.50); // Risky history: stricter

    return Math.min(0.80, Math.max(0.45, threshold));
  }
}

export default FraudService;
