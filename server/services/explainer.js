/**
 * Explainability Engine
 * Generates plain-English explanations for every transaction decision
 * All explanations are built from actual transaction data
 */

/**
 * Get status and detail for amount analysis
 * @param {number} currentAmount - Transaction amount
 * @param {number} avgAmount - User's average transaction amount
 * @returns {Object} { status, detail }
 */
const getAmountStatus = (currentAmount, avgAmount = 0) => {
  const ratio = avgAmount > 0 ? currentAmount / avgAmount : 1;

  if (ratio > 3) {
    return {
      status: 'danger',
      detail: `₹${currentAmount} is ${ratio.toFixed(1)}x your average (₹${avgAmount.toFixed(0)})`,
    };
  }

  if (ratio > 2) {
    return {
      status: 'warning',
      detail: `₹${currentAmount} is significantly higher than your average (₹${avgAmount.toFixed(0)})`,
    };
  }

  if (ratio > 1.5) {
    return {
      status: 'warning',
      detail: `₹${currentAmount} is slightly above your average (₹${avgAmount.toFixed(0)})`,
    };
  }

  return {
    status: 'normal',
    detail: `₹${currentAmount} is within your normal spending range`,
  };
};

/**
 * Get status and detail for location analysis
 * @param {string} city - Transaction city
 * @param {string} country - Transaction country
 * @param {Array} locationHistory - User's location history
 * @returns {Object} { status, detail }
 */
const getLocationStatus = (city, country, locationHistory = []) => {
  const knownCountries = new Set(locationHistory.map((l) => l.country));
  const knownCities = new Set(locationHistory.map((l) => l.city));

  if (!knownCountries.has(country)) {
    return {
      status: 'danger',
      detail: `First transaction from ${country} - you've never used this country before`,
    };
  }

  if (!knownCities.has(city)) {
    return {
      status: 'warning',
      detail: `New city: ${city}. You haven't transacted here before`,
    };
  }

  const frequency = locationHistory.find((l) => l.city === city)?.count || 0;
  return {
    status: 'normal',
    detail: `Known location (${city}). You've transacted here ${frequency} times before`,
  };
};

/**
 * Get status and detail for time analysis
 * @param {Date} timestamp - Transaction time
 * @param {Array} recentTransactions - Recent transactions
 * @returns {Object} { status, detail }
 */
const getTimeStatus = (timestamp, recentTransactions = []) => {
  const hour = new Date(timestamp).getHours();
  const hourString = String(hour).padStart(2, '0');

  if (hour >= 1 && hour <= 5) {
    return {
      status: 'danger',
      detail: `Transaction at ${hourString}:00 - very unusual (early morning hours)`,
    };
  }

  if (hour < 8 || hour > 22) {
    const count = recentTransactions.filter((t) => {
      const tHour = new Date(t.timestamp).getHours();
      return tHour < 8 || tHour > 22;
    }).length;

    if (count > 3) {
      return {
        status: 'warning',
        detail: `Transaction at ${hourString}:00 - unusual time (you have ${count} similar transactions recently)`,
      };
    }

    return {
      status: 'warning',
      detail: `Transaction at ${hourString}:00 - outside your typical hours (usually 8am-10pm)`,
    };
  }

  return {
    status: 'normal',
    detail: `Transaction at ${hourString}:00 - normal hours for you`,
  };
};

/**
 * Get status and detail for merchant analysis
 * @param {string} merchant - Merchant name
 * @param {string} category - Transaction category
 * @param {Array} recentTransactions - Recent transactions
 * @returns {Object} { status, detail }
 */
const getMerchantStatus = (merchant, category, recentTransactions = []) => {
  const knownCategories = new Set(recentTransactions.map((t) => t.category));

  if (!knownCategories.has(category)) {
    return {
      status: 'warning',
      detail: `New category: ${category}. This is your first transaction in this category`,
    };
  }

  const categoryFrequency = recentTransactions.filter((t) => t.category === category).length;
  return {
    status: 'normal',
    detail: `${merchant} (${category}). You've made ${categoryFrequency} transactions in this category`,
  };
};

/**
 * Generate comprehensive transaction explanation
 * @param {Object} transaction - Transaction data
 * @param {Object} userHistory - User's transaction history
 * @param {Object} riskAnalysis - Risk analysis from trust engine
 * @returns {Object} Detailed explanation with confidence and recommendation
 */
export const explainTransaction = (transaction = {}, userHistory = {}, riskAnalysis = {}) => {
  const {
    amount = 0,
    merchant = 'Unknown',
    category = 'other',
    city = 'Unknown',
    country = 'IN',
    timestamp = new Date(),
    deviceId = 'unknown',
  } = transaction;

  const { recentTransactions = [], locationHistory = [], knownDevices = [] } = userHistory;

  const trustScore = riskAnalysis.score || 50;
  const riskLevel = riskAnalysis.riskLevel || 'medium';

  // Analyze each factor
  const avgAmount = recentTransactions.length > 0
    ? recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length
    : amount;

  const amountStatus = getAmountStatus(amount, avgAmount);
  const locationStatus = getLocationStatus(city, country, locationHistory);
  const timeStatus = getTimeStatus(timestamp, recentTransactions);
  const merchantStatus = getMerchantStatus(merchant, category, recentTransactions);

  // Calculate confidence based on risk level
  let confidence = 85; // Base confidence
  if (riskLevel === 'high') confidence -= 20;
  if (riskLevel === 'medium') confidence -= 10;
  if (amountStatus.status === 'danger') confidence -= 5;
  if (locationStatus.status === 'danger') confidence -= 10;
  confidence = Math.max(0, Math.min(100, confidence));

  // Generate recommendation
  let recommendation = 'approve';
  if (trustScore < 30) recommendation = 'block';
  else if (trustScore < 50) recommendation = 'review';

  // Build human-readable explanation
  const date = new Date(timestamp);
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  let humanReadable = '';

  if (recommendation === 'approve') {
    humanReadable = `This ₹${amount} payment to ${merchant} at ${timeStr} looks normal. ${amountStatus.detail}. ${locationStatus.detail}. ${timeStatus.detail}. Your account is in good standing.`;
  } else if (recommendation === 'review') {
    const risks = [];
    if (amountStatus.status !== 'normal') risks.push(`unusual amount (${amountStatus.detail})`);
    if (locationStatus.status !== 'normal') risks.push(`unusual location (${locationStatus.detail})`);
    if (timeStatus.status !== 'normal') risks.push(`unusual time (${timeStatus.detail})`);

    humanReadable = `This ₹${amount} payment to ${merchant} needs review because of ${risks.join(', ')}. We recommend confirming this transaction before proceeding.`;
  } else if (recommendation === 'block') {
    const risks = [];
    if (amountStatus.status === 'danger') risks.push(`amount is ${(amount / avgAmount).toFixed(1)}x your average`);
    if (locationStatus.status === 'danger') risks.push(`new country (${country})`);
    if (timeStatus.status === 'danger') risks.push(`unusual time (${timeStr})`);

    humanReadable = `We've blocked this transaction for security. The ${risks.join(', ')}. Please contact support if this was intentional.`;
  }

  return {
    summary: `${recommendation === 'approve'
      ? `Normal transaction`
      : recommendation === 'review'
        ? `Needs verification`
        : `Blocked for security`
      } - ${trustScore >= 70 ? 'low risk' : trustScore >= 50 ? 'medium risk' : 'high risk'}`,
    factors: [
      {
        name: 'Amount',
        status: amountStatus.status,
        detail: amountStatus.detail,
      },
      {
        name: 'Location',
        status: locationStatus.status,
        detail: locationStatus.detail,
      },
      {
        name: 'Time',
        status: timeStatus.status,
        detail: timeStatus.detail,
      },
      {
        name: 'Merchant',
        status: merchantStatus.status,
        detail: merchantStatus.detail,
      },
    ],
    confidence: Math.round(confidence),
    recommendation,
    humanReadable,
    metadata: {
      trustScore,
      riskLevel,
      evaluatedAt: new Date().toISOString(),
      transactionId: transaction._id || 'new',
    },
  };
};

/**
 * Generate simple summary string
 * @param {Object} explanation - Explanation object from explainTransaction
 * @returns {string} One-line summary
 */
export const summarizeExplanation = (explanation = {}) => {
  const { summary, confidence, recommendation } = explanation;
  return `${summary} (${recommendation.toUpperCase()}, ${confidence}% confident)`;
};

/**
 * Generate detailed report for compliance
 * @param {Array} explanations - Array of explanation objects
 * @returns {Object} Compliance report
 */
export const generateComplianceReport = (explanations = []) => {
  const totalReviewed = explanations.length;
  const approved = explanations.filter((e) => e.recommendation === 'approve').length;
  const flagged = explanations.filter((e) => e.recommendation === 'review').length;
  const blocked = explanations.filter((e) => e.recommendation === 'block').length;

  const avgConfidence =
    explanations.reduce((sum, e) => sum + (e.confidence || 0), 0) / (totalReviewed || 1);

  return {
    summary: {
      totalReviewed,
      approved,
      flagged,
      blocked,
      blockRate: `${((blocked / totalReviewed) * 100).toFixed(2)}%`,
    },
    confidence: {
      average: Math.round(avgConfidence),
      highConfidence: explanations.filter((e) => (e.confidence || 0) >= 80).length,
    },
    riskDistribution: {
      low: explanations.filter((e) => e.metadata?.riskLevel === 'low').length,
      medium: explanations.filter((e) => e.metadata?.riskLevel === 'medium').length,
      high: explanations.filter((e) => e.metadata?.riskLevel === 'high').length,
    },
  };
};

export default {
  explainTransaction,
  summarizeExplanation,
  generateComplianceReport,
};
