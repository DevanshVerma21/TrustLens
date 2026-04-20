/**
 * Trust Score Engine
 * Calculates trust score (0-100) based on weighted risk factors
 * All logic is deterministic and explainable
 */

/**
 * Calculate transaction pattern risk
 * @param {number} currentAmount - Transaction amount
 * @param {Array} recentTransactions - Transactions from last 30 days
 * @returns {Object} { riskLevel, multiplier, reason }
 */
export const analyzeTransactionPattern = (currentAmount, recentTransactions = []) => {
  if (recentTransactions.length === 0) {
    return { riskLevel: 'low', multiplier: 0, reason: 'No transaction history' };
  }

  const avgAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length;
  const amountRatio = currentAmount / avgAmount;

  // Check amount anomaly
  if (amountRatio > 3) {
    return {
      riskLevel: 'critical',
      multiplier: 50,
      reason: `Amount is ${amountRatio.toFixed(1)}x average (avg: ₹${avgAmount.toFixed(0)})`,
    };
  }

  if (amountRatio > 2) {
    return {
      riskLevel: 'high',
      multiplier: 30,
      reason: `Amount is ${amountRatio.toFixed(1)}x average`,
    };
  }

  if (amountRatio > 1.5) {
    return {
      riskLevel: 'medium',
      multiplier: 15,
      reason: `Amount is slightly above average`,
    };
  }

  return { riskLevel: 'low', multiplier: 0, reason: 'Amount within normal range' };
};

/**
 * Analyze location risk
 * @param {string} currentCountry - Current transaction country
 * @param {string} currentCity - Current transaction city
 * @param {Array} locationHistory - Array of { country, city, count, lastUsed }
 * @returns {Object} { riskLevel, multiplier, reason }
 */
export const analyzeLocationRisk = (currentCountry, currentCity, locationHistory = []) => {
  const knownCountries = new Set(locationHistory.map((l) => l.country));
  const knownCities = new Set(locationHistory.map((l) => l.city));

  // New country = critical
  if (!knownCountries.has(currentCountry)) {
    return {
      riskLevel: 'critical',
      multiplier: 50,
      reason: `Transaction from ${currentCountry} - never used before`,
    };
  }

  // New city in known country = medium
  if (!knownCities.has(currentCity)) {
    return {
      riskLevel: 'medium',
      multiplier: 15,
      reason: `First transaction in ${currentCity}`,
    };
  }

  return {
    riskLevel: 'low',
    multiplier: 0,
    reason: `Known location (${currentCity}, ${currentCountry})`,
  };
};

/**
 * Analyze time pattern risk
 * @param {Date} timestamp - Transaction timestamp
 * @param {Array} recentTransactions - Recent transactions for pattern analysis
 * @returns {Object} { riskLevel, multiplier, reason }
 */
export const analyzeTimePattern = (timestamp, recentTransactions = []) => {
  const hour = timestamp.getHours();

  // Overnight transactions (1am-5am)
  if (hour >= 1 && hour <= 5) {
    return {
      riskLevel: 'high',
      multiplier: 30,
      reason: `Transaction at ${hour}:00 - unusual time (typically 1am-5am)`,
    };
  }

  // Count transactions outside normal hours (8am-10pm) in last 7 days
  const sevenDaysAgo = new Date(timestamp.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentOutsideHours = recentTransactions.filter((t) => {
    const tDate = new Date(t.timestamp);
    if (tDate < sevenDaysAgo) return false;
    const tHour = tDate.getHours();
    return tHour < 8 || tHour > 22;
  }).length;

  if (recentOutsideHours > 3) {
    return {
      riskLevel: 'medium',
      multiplier: 15,
      reason: `${recentOutsideHours} unusual-time transactions in past week`,
    };
  }

  return {
    riskLevel: 'low',
    multiplier: 0,
    reason: `Transaction at ${hour}:00 - normal hours`,
  };
};

/**
 * Analyze account history risk
 * @param {Object} userProfile - { accountAge, fraudFlags, totalTransactions, consistencyScore }
 * @returns {Object} { riskLevel, multiplier, reason, bonus }
 */
export const analyzeAccountHistory = (userProfile = {}) => {
  const { accountAge = 0, fraudFlags = 0, totalTransactions = 0, consistencyScore = 0.5 } = userProfile;

  let risk = 0;
  let bonus = 0;
  let reasons = [];

  // New account = high risk
  if (accountAge < 30) {
    risk = 30;
    reasons.push(`New account (${accountAge} days old)`);
  } else if (accountAge < 90) {
    risk = 15;
    reasons.push(`Relatively new account (${accountAge} days old)`);
  }

  // Previous fraud flags = heavy penalty
  if (fraudFlags > 0) {
    risk += fraudFlags * 20;
    reasons.push(`${fraudFlags} previous fraud flag(s)`);
  }

  // Consistent behavior = bonus
  if (totalTransactions > 50 && consistencyScore > 0.8) {
    bonus = 10;
    reasons.push('Excellent transaction consistency');
  } else if (totalTransactions > 30 && consistencyScore > 0.7) {
    bonus = 5;
    reasons.push('Good transaction consistency');
  }

  const riskLevel = risk > 30 ? 'high' : risk > 15 ? 'medium' : 'low';

  return {
    riskLevel,
    multiplier: Math.max(0, risk - bonus),
    bonus,
    reason: reasons.join('; ') || 'Established account with clean history',
  };
};

/**
 * Analyze device and session risk
 * @param {string} deviceId - Current device identifier
 * @param {Array} knownDevices - Array of known device IDs
 * @param {number} failedLogins - Number of failed login attempts
 * @returns {Object} { riskLevel, multiplier, reason }
 */
export const analyzeDeviceRisk = (deviceId, knownDevices = [], failedLogins = 0) => {
  let risk = 0;
  let reasons = [];

  // New device
  if (!knownDevices.includes(deviceId)) {
    risk = 15;
    reasons.push('New device');
  }

  // Failed logins
  if (failedLogins > 3) {
    risk += failedLogins * 10;
    reasons.push(`${failedLogins} failed login attempts`);
  }

  const riskLevel = risk > 30 ? 'high' : risk > 15 ? 'medium' : 'low';

  return {
    riskLevel,
    multiplier: risk,
    reason: reasons.join('; ') || 'Device recognized',
  };
};

/**
 * Calculate overall trust score
 * @param {Object} transaction - { amount, country, city, timestamp, deviceId, category }
 * @param {Object} userHistory - { recentTransactions, locationHistory, userProfile, knownDevices }
 * @returns {Object} { score, riskLevel, factors, reasoning }
 */
export const calculateTrustScore = (transaction, userHistory = {}) => {
  const {
    recentTransactions = [],
    locationHistory = [],
    userProfile = {},
    knownDevices = [],
  } = userHistory;

  let score = 50; // Base score
  const factors = [];

  // Factor 1: Transaction Pattern (30% weight)
  const patternRisk = analyzeTransactionPattern(transaction.amount, recentTransactions);
  const patternAdjustment = -(patternRisk.multiplier * 0.3);
  score += patternAdjustment;
  factors.push({
    name: 'Transaction Pattern',
    weight: 30,
    riskLevel: patternRisk.riskLevel,
    adjustment: patternAdjustment,
    reason: patternRisk.reason,
  });

  // Factor 2: Location Risk (20% weight)
  const locationRisk = analyzeLocationRisk(
    transaction.country || 'IN',
    transaction.city || 'Unknown',
    locationHistory
  );
  const locationAdjustment = -(locationRisk.multiplier * 0.2);
  score += locationAdjustment;
  factors.push({
    name: 'Location Risk',
    weight: 20,
    riskLevel: locationRisk.riskLevel,
    adjustment: locationAdjustment,
    reason: locationRisk.reason,
  });

  // Factor 3: Time Pattern (15% weight)
  const timeRisk = analyzeTimePattern(new Date(transaction.timestamp), recentTransactions);
  const timeAdjustment = -(timeRisk.multiplier * 0.15);
  score += timeAdjustment;
  factors.push({
    name: 'Time Pattern',
    weight: 15,
    riskLevel: timeRisk.riskLevel,
    adjustment: timeAdjustment,
    reason: timeRisk.reason,
  });

  // Factor 4: Account History (20% weight)
  const historyRisk = analyzeAccountHistory(userProfile);
  const historyAdjustment = -(historyRisk.multiplier * 0.2) + (historyRisk.bonus * 0.2);
  score += historyAdjustment;
  factors.push({
    name: 'Account History',
    weight: 20,
    riskLevel: historyRisk.riskLevel,
    adjustment: historyAdjustment,
    reason: historyRisk.reason,
  });

  // Factor 5: Device/Session (15% weight)
  const deviceRisk = analyzeDeviceRisk(transaction.deviceId, knownDevices);
  const deviceAdjustment = -(deviceRisk.multiplier * 0.15);
  score += deviceAdjustment;
  factors.push({
    name: 'Device/Session',
    weight: 15,
    riskLevel: deviceRisk.riskLevel,
    adjustment: deviceAdjustment,
    reason: deviceRisk.reason,
  });

  // Clamp score to 0-100
  const finalScore = Math.max(0, Math.min(100, score));

  // Determine risk level
  let riskLevel = 'low';
  if (finalScore < 40) riskLevel = 'high';
  else if (finalScore < 60) riskLevel = 'medium';

  // Determine recommendation
  let recommendation = 'approve';
  if (finalScore < 30) recommendation = 'block';
  else if (finalScore < 50) recommendation = 'review';

  return {
    score: Math.round(finalScore),
    riskLevel,
    recommendation,
    factors,
    reasoning: {
      strongestRisk: factors.reduce((max, f) => (f.adjustment < max.adjustment ? f : max)),
      patternAnalysis: patternRisk,
      locationAnalysis: locationRisk,
      timeAnalysis: timeRisk,
      historyAnalysis: historyRisk,
      deviceAnalysis: deviceRisk,
    },
  };
};

/**
 * Calculate fraud score (0-1)
 * @param {number} trustScore - Trust score (0-100)
 * @returns {number} Fraud probability
 */
export const calculateFraudScore = (trustScore) => {
  // Inverse linear relationship: low trust = high fraud
  return Math.max(0, Math.min(1, (100 - trustScore) / 100));
};

export default {
  calculateTrustScore,
  calculateFraudScore,
  analyzeTransactionPattern,
  analyzeLocationRisk,
  analyzeTimePattern,
  analyzeAccountHistory,
  analyzeDeviceRisk,
};
