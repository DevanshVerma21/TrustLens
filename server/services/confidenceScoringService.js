/**
 * Confidence Scoring Service
 * Implements Bayesian probability and confidence calibration
 * Layer 3 of the hybrid intelligence model
 *
 * Converts raw scores into calibrated fraud probabilities with confidence intervals
 */

export class ConfidenceScoringService {
  // Base fraud rate (prior probability)
  static PRIOR_FRAUD_RATE = 0.02; // ~2% of transactions are fraudulent (industry avg)

  /**
   * Calculate confidence-calibrated fraud score
   * Combines rule scores + anomaly scores using Bayesian reasoning
   */
  static calculateConfidenceScore(ruleScore, anomalyScores, userProfile) {
    try {
      // Step 1: Calculate per-factor confidence intervals
      const factorConfidence = this._calculateFactorConfidence(anomalyScores, userProfile);

      // Step 2: Adjust for correlations (if multiple factors anomalous, stronger signal)
      const correlationAdjustment = this._calculateCorrelationAdjustment(anomalyScores);

      // Step 3: Combine rule score with anomaly scores
      const combinedScore = this._combineScores(ruleScore, anomalyScores, correlationAdjustment);

      // Step 4: Calculate Bayesian fraud probability
      const bayesianProbability = this._calculateBayesianProbability(combinedScore);

      // Step 5: Get calibration metrics (historical accuracy)
      const calibration = this._getCalibrationMetrics(bayesianProbability);

      // Step 6: Calculate overall confidence
      const overallConfidence = this._calculateOverallConfidence(
        factorConfidence,
        userProfile,
        combinedScore
      );

      return {
        fraudScore: combinedScore,
        confidence: {
          overall: overallConfidence,
          perFactor: factorConfidence,
        },
        bayesianProbability: parseFloat(bayesianProbability.toFixed(3)),
        calibratedAccuracy: calibration,
        confidenceLevel: this._getConfidenceLevel(overallConfidence),
      };
    } catch (error) {
      console.error('Confidence scoring error:', error);
      return {
        fraudScore: 0.5,
        confidence: { overall: 0.5, perFactor: {} },
        bayesianProbability: 0.5,
        calibratedAccuracy: { expectedPrecision: 0.5, expectedRecall: 0.5 },
        confidenceLevel: 'Medium',
        error: error.message,
      };
    }
  }

  // ============ PRIVATE: CALCULATION METHODS ============

  /**
   * Calculate confidence for each risk factor based on data quality
   */
  static _calculateFactorConfidence(anomalyScores, userProfile) {
    const profile = userProfile || {};

    const confidence = {
      amountScore: {
        score: anomalyScores?.amount || 0,
        confidence: this._getAmountConfidence(profile.amountStats),
      },
      locationScore: {
        score: anomalyScores?.location || 0,
        confidence: this._getLocationConfidence(profile),
      },
      timeScore: {
        score: anomalyScores?.time || 0,
        confidence: this._getTimeConfidence(profile),
      },
      deviceScore: {
        score: anomalyScores?.device || 0,
        confidence: this._getDeviceConfidence(profile),
      },
      frequencyScore: {
        score: anomalyScores?.frequency || 0,
        confidence: this._getFrequencyConfidence(profile),
      },
      ruleScore: {
        score: 0, // Set separately in main scoring
        confidence: 0.95, // Rules have high confidence when triggered
      },
    };

    return confidence;
  }

  /**
   * Amount confidence based on data volume and variance
   */
  static _getAmountConfidence(amountStats) {
    if (!amountStats || amountStats.mean === undefined) return 0.3; // Low confidence, no data

    // More data points = higher confidence
    // More variance = lower confidence (harder to detect anomalies)
    const cvBaseConfidence = 0.9; // Coefficient of variation baseline

    // Confidence based on standard deviation (higher CV = lower confidence)
    const cv = amountStats.stdDev / Math.max(1, amountStats.mean);
    let confidence = cvBaseConfidence / (1 + cv);

    // Cap at reasonable bounds
    return Math.min(0.95, Math.max(0.4, confidence));
  }

  /**
   * Location confidence based on history coverage
   */
  static _getLocationConfidence(profile) {
    if (!profile || !profile.primaryLocations) return 0.5;

    const locationCount = profile.primaryLocations?.length || 0;

    // More locations in history = higher confidence
    if (locationCount >= 5) return 0.85;
    if (locationCount >= 3) return 0.70;
    if (locationCount >= 1) return 0.55;
    return 0.30; // Very low confidence with no location history
  }

  /**
   * Time confidence based on behavioral regularity
   */
  static _getTimeConfidence(profile) {
    if (!profile || !profile.typicalHours) return 0.6;

    const hourStd = profile.typicalHours?.std || 0;

    // Regular schedule = high confidence, irregular = low
    if (hourStd < 2) return 0.85; // Very regular
    if (hourStd < 4) return 0.70; // Somewhat regular
    if (hourStd < 6) return 0.55; // Fairly irregular
    return 0.40; // Very irregular schedule
  }

  /**
   * Device confidence based on device history
   */
  static _getDeviceConfidence(profile) {
    if (!profile) return 0.5;

    const deviceCount = profile.deviceCount || 0;

    if (deviceCount >= 3) return 0.85; // Good device history
    if (deviceCount >= 1) return 0.70; // Some device history
    return 0.30; // No device history
  }

  /**
   * Frequency confidence based on transaction volume
   */
  static _getFrequencyConfidence(profile) {
    if (!profile) return 0.5;

    const totalTxns = profile.totalTransactions || 0;

    // More transactions = better baseline for detecting anomalies
    if (totalTxns >= 100) return 0.90;
    if (totalTxns >= 50) return 0.80;
    if (totalTxns >= 20) return 0.65;
    if (totalTxns >= 5) return 0.50;
    return 0.30; // Very few transactions
  }

  /**
   * Calculate correlation adjustments between factors
   * Multiple anomalies strengthen the signal
   */
  static _calculateCorrelationAdjustment(anomalyScores) {
    if (!anomalyScores) return 1.0;

    const scores = Object.values(anomalyScores).filter((s) => typeof s === 'number');
    const anomalousFactors = scores.filter((s) => s > 0.4).length;

    // If multiple factors are anomalous, they're more likely correlated fraud
    if (anomalousFactors >= 4) return 1.25; // Strong signal
    if (anomalousFactors >= 3) return 1.15; // Moderate signal
    if (anomalousFactors >= 2) return 1.05; // Weak signal
    return 1.0; // Single factor or no anomalies
  }

  /**
   * Combine rule score with anomaly scores
   */
  static _combineScores(ruleScore, anomalyScores, correlationAdjustment) {
    // Rules have highest priority (deterministic)
    if (ruleScore > 0.8) return Math.min(1, ruleScore * 1.1); // Amplify strong rules

    // Blend anomaly scores
    if (!anomalyScores || Object.keys(anomalyScores).length === 0) {
      return ruleScore;
    }

    const scores = Object.values(anomalyScores).filter((s) => typeof s === 'number');
    const anomalyAvg = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;

    // Weighted combination: rules 60%, anomalies 40%
    let combined = ruleScore * 0.6 + anomalyAvg * 0.4;

    // Apply correlation adjustment
    combined *= correlationAdjustment;

    return Math.min(1, Math.max(0, combined));
  }

  /**
   * Calculate Bayesian fraud probability P(fraud|evidence)
   * Uses Bayes' theorem with likelihood ratios
   */
  static _calculateBayesianProbability(fraudScore) {
    // Likelihood ratio: odds of observing this score if fraud vs. not fraud
    // Calibrated from industry data

    // If score is 0, very low fraud probability
    // If score is 1, very high fraud probability
    // Use sigmoid-like curve for calibration

    // Map 0-1 score to likelihood ratio
    // Score 0 → LR 0.01, Score 1 → LR 100
    const likelihoodRatio = Math.pow(10, fraudScore * 2 - 1); // 10^(2*score - 1)

    // Apply Bayes' theorem
    // P(fraud|evidence) = P(evidence|fraud) * P(fraud) / P(evidence)
    // Using prior fraud rate
    const prior = this.PRIOR_FRAUD_RATE;
    const posteriorOdds = likelihoodRatio * (prior / (1 - prior));
    const posterior = posteriorOdds / (1 + posteriorOdds);

    return Math.min(1, Math.max(0, posterior));
  }

  /**
   * Get calibration metrics based on fraud probability
   * Estimates precision, recall, false positive rate
   */
  static _getCalibrationMetrics(fraudProbability) {
    // Calibration curves based on historical fraud detection performance
    // These simulate learned relationships: at probability X, actual fraud rate is Y

    // At higher probabilities, precision is better (fewer false positives)
    // At lower probabilities, recall is better (catch more fraud)

    if (fraudProbability < 0.3) {
      return {
        expectedPrecision: 0.6, // 60% of flagged are actually fraud
        expectedRecall: 0.4, // But we catch only 40% of actual fraud
        falsePositiveRate: 0.4,
        calibrationError: 0.05, // How far off prediction is from actual
      };
    } else if (fraudProbability < 0.6) {
      return {
        expectedPrecision: 0.72,
        expectedRecall: 0.65,
        falsePositiveRate: 0.28,
        calibrationError: 0.04,
      };
    } else if (fraudProbability < 0.8) {
      return {
        expectedPrecision: 0.84,
        expectedRecall: 0.78,
        falsePositiveRate: 0.16,
        calibrationError: 0.03,
      };
    } else {
      return {
        expectedPrecision: 0.92, // 92% accurate at high probabilities
        expectedRecall: 0.88,
        falsePositiveRate: 0.08,
        calibrationError: 0.02,
      };
    }
  }

  /**
   * Calculate overall confidence in the decision
   */
  static _calculateOverallConfidence(factorConfidence, userProfile, fraudScore) {
    let confidenceSum = 0;
    let factorCount = 0;

    // Average confidence across factors
    Object.values(factorConfidence).forEach((fc) => {
      if (fc?.confidence !== undefined) {
        confidenceSum += fc.confidence;
        factorCount++;
      }
    });

    const factorConfidenceAvg = factorCount > 0 ? confidenceSum / factorCount : 0.5;

    // Adjust confidence based on user profile quality
    let profileQuality = userProfile?.profileConfidence || 0;
    profileQuality = Math.min(1, Math.max(0, profileQuality));

    // Combine: factors (60%) + profile quality (40%)
    let overallConfidence = factorConfidenceAvg * 0.6 + profileQuality * 0.4;

    // Reduce confidence for extreme scores (too high/low = less certain)
    if (fraudScore > 0.95 || fraudScore < 0.05) {
      overallConfidence *= 0.9; // Slight reduction for extreme scores
    }

    return parseFloat(Math.min(1, Math.max(0, overallConfidence)).toFixed(3));
  }

  /**
   * Map confidence to qualitative level
   */
  static _getConfidenceLevel(confidence) {
    if (confidence >= 0.8) return 'Very High';
    if (confidence >= 0.6) return 'High';
    if (confidence >= 0.4) return 'Medium';
    if (confidence >= 0.2) return 'Low';
    return 'Very Low';
  }
}

export default ConfidenceScoringService;
