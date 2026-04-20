/**
 * Explainability Service - Enhanced
 * Provides structured, confidence-based explanations for fraud detection
 * Output format matches banking-grade fraud explanations with evidence chains
 */

export class ExplainabilityService {
  /**
   * Generate structured explanations with evidence and confidence
   */
  generateExplanations(transactionData, fraudAnalysis, userContext) {
    const reasons = [];

    // Use detailed fraud analysis from hybrid model
    const ruleAnalysis = fraudAnalysis.ruleAnalysis || {};
    const anomalyDetails = fraudAnalysis.anomalyDetails || {};
    const confidence = fraudAnalysis.confidence || {};

    // Add rule-based reasons (highest priority)
    if (ruleAnalysis.rulesApplied && ruleAnalysis.rulesApplied.length > 0) {
      ruleAnalysis.rulesApplied.forEach((rule) => {
        reasons.push({
          type: 'rule',
          factor: `Rule: ${rule.ruleName}`,
          score: rule.score,
          confidence: rule.confidence,
          detail: rule.reason,
          evidence: [`Rule ID: ${rule.ruleId}`, `Action: ${rule.action}`, `Priority: ${rule.priority}`],
          action: rule.action,
          ruleId: rule.ruleId,
        });
      });
    }

    // Add amount anomaly explanation
    if (anomalyDetails.amountScore && anomalyDetails.amountScore.anomalyScore > 0.4) {
      const detail = anomalyDetails.amountScore.explanation || 'High transaction amount';
      const evidence = [`Amount: $${transactionData.amount}`];
      if (anomalyDetails.amountScore.percentile !== undefined) {
        evidence.push(`Percentile: ${anomalyDetails.amountScore.percentile}th`);
      }
      if (anomalyDetails.amountScore.zScore !== undefined) {
        evidence.push(`Z-Score: ${anomalyDetails.amountScore.zScore.toFixed(2)}σ`);
      }
      if (userContext?.averageAmount) {
        evidence.push(`Your average: $${userContext.averageAmount.toFixed(2)}`);
      }

      reasons.push({
        type: 'amount',
        factor: 'Statistical Anomaly',
        score: anomalyDetails.amountScore.anomalyScore,
        confidence: confidence.perFactor?.amountScore?.confidence || 0.8,
        detail,
        evidence,
        userContext: this._buildAmountContext(userContext),
      });
    }

    // Add location anomaly explanation
    if (anomalyDetails.locationScore && anomalyDetails.locationScore.anomalyScore > 0.4) {
      const detail = anomalyDetails.locationScore.explanation || 'Geographic anomaly detected';
      const evidence = [`Location: ${transactionData.location}`];
      if (anomalyDetails.locationScore.isNewLocation) {
        evidence.push('First-time location for your account');
      }

      reasons.push({
        type: 'location',
        factor: 'Geographic Pattern',
        score: anomalyDetails.locationScore.anomalyScore,
        confidence: confidence.perFactor?.locationScore?.confidence || 0.7,
        detail,
        evidence,
        userContext: this._buildLocationContext(userContext),
      });
    }

    // Add time anomaly explanation
    if (anomalyDetails.timeScore && anomalyDetails.timeScore.anomalyScore > 0.4) {
      const detail = anomalyDetails.timeScore.explanation || 'Unusual transaction timing';
      const hour = new Date(transactionData.timestamp).getHours();
      const evidence = [`Time: ${hour}:00`];
      if (anomalyDetails.timeScore.riskFactors?.burstRisk > 0.5) {
        evidence.push('Burst pattern detected');
      }

      reasons.push({
        type: 'time',
        factor: 'Temporal Pattern',
        score: anomalyDetails.timeScore.anomalyScore,
        confidence: confidence.perFactor?.timeScore?.confidence || 0.8,
        detail,
        evidence,
      });
    }

    // Add device anomaly explanation
    if (anomalyDetails.deviceScore && anomalyDetails.deviceScore.anomalyScore > 0.4) {
      const detail = anomalyDetails.deviceScore.explanation || 'Device anomaly detected';
      const evidence = [`Device: ${transactionData.deviceName}`];
      if (anomalyDetails.deviceScore.isNewDevice) {
        evidence.push('First-time device for your account');
      }

      reasons.push({
        type: 'device',
        factor: 'Device Fingerprint',
        score: anomalyDetails.deviceScore.anomalyScore,
        confidence: confidence.perFactor?.deviceScore?.confidence || 0.8,
        detail,
        evidence,
        userContext: this._buildDeviceContext(userContext),
      });
    }

    // Add frequency anomaly explanation
    if (anomalyDetails.frequencyScore && anomalyDetails.frequencyScore.anomalyScore > 0.4) {
      const detail = anomalyDetails.frequencyScore.explanation || 'Unusual transaction frequency';
      const evidence = [];
      if (anomalyDetails.frequencyScore.burstDetected) {
        evidence.push('Multiple transactions in rapid succession');
      }

      reasons.push({
        type: 'frequency',
        factor: 'Transaction Velocity',
        score: anomalyDetails.frequencyScore.anomalyScore,
        confidence: confidence.perFactor?.frequencyScore?.confidence || 0.7,
        detail,
        evidence,
      });
    }

    // If no significant anomalies, provide positive confirmation
    if (reasons.length === 0) {
      reasons.push({
        type: 'normal',
        factor: 'Clean Transaction',
        score: 0.1,
        confidence: 0.9,
        detail: 'Transaction appears normal - no suspicious patterns detected',
        evidence: [
          'Amount within typical range',
          'Known location',
          'Known device',
          'Normal transaction time',
          'Regular frequency',
        ],
      });
    }

    return reasons;
  }

  /**
   * Generate detailed summary with risk assessment
   */
  generateSummary(fraudScore, reasons, fraudAnalysis) {
    const confidence = fraudAnalysis?.confidence?.overall || 0.5;
    const bayesianProb = fraudAnalysis?.bayesianProbability || fraudScore;

    let riskLevel = '🟢 Low Risk';
    let summary = '';
    let recommendation = 'Transaction approved';
    let falsePositiveRisk = 'Low - Less than 5% chance';

    if (fraudScore > 0.85) {
      riskLevel = '🔴 CRITICAL - Block Transaction';
      summary = 'Multiple severe fraud indicators detected. Immediate action required.';
      recommendation = 'BLOCK transaction. Investigate account.';
      falsePositiveRisk = '5-10% - Monitor account';
    } else if (fraudScore > 0.75) {
      riskLevel = '🔴 Critical Risk - Manual Review';
      summary = 'Severe fraud patterns detected. Requires immediate investigation.';
      recommendation = 'Flag for manual review. Contact cardholder if possible.';
      falsePositiveRisk = '8-15% chance this is legitimate';
    } else if (fraudScore > 0.65) {
      riskLevel = '🟠 High Risk - Review Needed';
      summary = 'Multiple suspicious patterns combined. Recommend careful review.';
      recommendation = 'Flag for review. Consider requesting verification.';
      falsePositiveRisk = '15-25% chance this is legitimate';
    } else if (fraudScore > 0.5) {
      riskLevel = '🟡 Medium-High Risk - Under Review';
      summary = 'Some concerning patterns detected. Recommend monitoring.';
      recommendation = 'Flag for secondary review if high-value transaction.';
      falsePositiveRisk = '25-35% chance this is legitimate';
    } else if (fraudScore > 0.35) {
      riskLevel = '🟡 Medium Risk - Monitor';
      summary = 'Minor anomalies detected. Low fraud probability.';
      recommendation = 'Approve with monitoring. Log for pattern analysis.';
      falsePositiveRisk = 'Moderate - Around 40-50%';
    } else {
      riskLevel = '🟢 Low Risk - Approved';
      summary = 'Transaction appears normal and safe to proceed.';
      recommendation = 'Approve immediately.';
      falsePositiveRisk = 'Very low - Less than 10%';
    }

    // Get primary concern if multiple reasons
    let primaryConcern = 'Normal transaction pattern';
    if (reasons.length > 0) {
      const topReason = reasons.reduce((max, r) => (r.score > max.score ? r : max), reasons[0]);
      primaryConcern = `${topReason.factor}: ${topReason.detail}`;
    }

    return {
      riskLevel,
      summary,
      primaryConcern,
      recommendation,
      falsePositiveRisk,
      reasonCount: reasons.length,
      confidenceScore: `${(confidence * 100).toFixed(1)}%`,
      predictedAccuracy: `${(bayesianProb * 100).toFixed(1)}% likely fraud`,
    };
  }

  /**
   * Generate detailed confidence metrics
   */
  generateConfidenceMetrics(fraudAnalysis) {
    const riskFactors = fraudAnalysis.riskFactors || {};
    const anomalyDetails = fraudAnalysis.anomalyDetails || {};

    // Calculate feature importance
    const total = Object.values(riskFactors).reduce((a, b) => a + b, 0) || 1;
    const amountImportance = ((riskFactors.amountRisk || 0) / total * 100).toFixed(1);
    const locationImportance = ((riskFactors.locationRisk || 0) / total * 100).toFixed(1);
    const timeImportance = ((riskFactors.timeRisk || 0) / total * 100).toFixed(1);
    const deviceImportance = ((riskFactors.deviceRisk || 0) / total * 100).toFixed(1);
    const frequencyImportance = ((riskFactors.frequencyRisk || 0) / total * 100).toFixed(1);

    return {
      // Individual risk scores
      amountConfidence: `${(riskFactors.amountRisk * 100).toFixed(1)}%`,
      locationConfidence: `${(riskFactors.locationRisk * 100).toFixed(1)}%`,
      timeConfidence: `${(riskFactors.timeRisk * 100).toFixed(1)}%`,
      deviceConfidence: `${(riskFactors.deviceRisk * 100).toFixed(1)}%`,
      frequencyConfidence: `${(riskFactors.frequencyRisk * 100).toFixed(1)}%`,

      // Feature importance
      featureImportance: {
        amount: `${amountImportance}%`,
        location: `${locationImportance}%`,
        time: `${timeImportance}%`,
        device: `${deviceImportance}%`,
        frequency: `${frequencyImportance}%`,
      },

      // Top contributing factors
      topRiskFactors: this._getTopRiskFactors(riskFactors),

      // Detection methods used
      detectionMethods: this._getDetectionMethods(fraudAnalysis),

      // Calibration info
      calibration: fraudAnalysis.calibratedAccuracy || {},
    };
  }

  // ============ PRIVATE: HELPER METHODS ============

  _buildAmountContext(userContext) {
    if (!userContext || !userContext.averageAmount) return 'No amount baseline available';
    const ratio = (userContext.amount / userContext.averageAmount).toFixed(1);
    return `Your recent transactions average $${userContext.averageAmount.toFixed(0)}. This is ${ratio}x your typical amount.`;
  }

  _buildLocationContext(userContext) {
    if (!userContext || !userContext.primaryLocations) return 'Limited location history';
    const locations = userContext.primaryLocations || [];
    if (locations.length === 0) return 'No known locations on record';
    return `Your typical locations: ${locations.slice(0, 3).join(', ')}`;
  }

  _buildDeviceContext(userContext) {
    if (!userContext || !userContext.deviceCount) return 'Limited device history';
    if (userContext.deviceCount === 0) return 'No previous devices recorded';
    return `You have ${userContext.deviceCount} known device(s) on file.`;
  }

  _getTopRiskFactors(riskFactors) {
    const factors = [
      { name: 'Amount', score: riskFactors.amountRisk, weight: 0.3 },
      { name: 'Location', score: riskFactors.locationRisk, weight: 0.25 },
      { name: 'Time', score: riskFactors.timeRisk, weight: 0.15 },
      { name: 'Device', score: riskFactors.deviceRisk, weight: 0.2 },
      { name: 'Frequency', score: riskFactors.frequencyRisk, weight: 0.1 },
    ];

    return factors
      .filter((f) => f.score > 0)
      .sort((a, b) => b.score * b.weight - a.score * a.weight)
      .slice(0, 3)
      .map((f) => ({
        factor: f.name,
        contribution: `${(f.score * f.weight * 100).toFixed(1)}%`,
      }));
  }

  _getDetectionMethods(fraudAnalysis) {
    const methods = [];
    const ruleAnalysis = fraudAnalysis.ruleAnalysis || {};
    const anomalyDetails = fraudAnalysis.anomalyDetails || {};

    if (ruleAnalysis.rulesApplied && ruleAnalysis.rulesApplied.length > 0) {
      methods.push(`Rule Engine (${ruleAnalysis.rulesApplied.length} rules triggered)`);
    }

    if (anomalyDetails.amountScore) {
      methods.push('Isolation Forest + Adaptive Z-Score');
    }

    if (anomalyDetails.locationScore) {
      methods.push('Geographic Velocity Analysis');
    }

    if (anomalyDetails.timeScore) {
      methods.push('Temporal Pattern Detection');
    }

    if (anomalyDetails.deviceScore) {
      methods.push('Device Fingerprinting');
    }

    if (anomalyDetails.frequencyScore) {
      methods.push('Local Outlier Factor (LOF)');
    }

    return methods;
  }
}

export default ExplainabilityService;
