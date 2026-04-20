/**
 * Fraud Simulation Engine
 * Generates realistic fraud scenarios for testing and demo purposes
 * All scenarios return deterministic, explainable patterns
 */

import { calculateTrustScore, calculateFraudScore } from './trustEngine.js';

/**
 * Generate card cloning scenario
 * Multiple small transactions in quick succession from different cities
 * @param {string} userId - User ID
 * @param {Object} baseTransaction - Base transaction to build from
 * @returns {Object} { transactions, expectedAlerts, expectedTrustDelta }
 */
export const generateCardCloningScenario = (userId, baseTransaction = {}) => {
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'];
  const merchants = ['Quick Mart', 'Mini Convenience', 'Local Store'];
  const baseTime = new Date(baseTransaction.timestamp || Date.now());

  const transactions = [];

  // 5 transactions in 3 minutes across different cities
  for (let i = 0; i < 5; i++) {
    const timestamp = new Date(baseTime.getTime() + i * 60 * 1000); // 1 minute apart
    transactions.push({
      userId,
      amount: 100 + Math.random() * 200, // Small amounts ₹100-300
      merchant: merchants[i % merchants.length],
      city: cities[i % cities.length],
      country: 'IN',
      category: 'shopping',
      deviceId: `cloned_device_${i}`,
      timestamp,
      type: 'fraud',
    });
  }

  return {
    name: 'Card Cloning',
    description: 'Multiple small transactions in quick succession from different locations',
    transactions,
    expectedAlerts: [
      'velocity_attack',
      'location_anomaly',
      'device_anomaly',
    ],
    expectedTrustDelta: -25,
    detectionDifficulty: 'Easy', // Should be caught by time + location analysis
  };
};

/**
 * Generate account takeover scenario
 * Login from new country + immediate large transfer
 * @param {string} userId - User ID
 * @param {Object} baseTransaction - Base transaction
 * @returns {Object} { transactions, expectedAlerts, expectedTrustDelta }
 */
export const generateAccountTakeoverScenario = (userId, baseTransaction = {}) => {
  const baseTime = new Date(baseTransaction.timestamp || Date.now());

  const transactions = [
    // First: transaction from new country
    {
      userId,
      amount: 50000, // Large amount
      merchant: 'International Bank Transfer',
      city: 'Singapore',
      country: 'SG',
      category: 'transfer',
      deviceId: 'unknown_device_sg',
      timestamp: new Date(baseTime.getTime()),
      type: 'fraud',
    },
    // Second: large amount confirmation from another location
    {
      userId,
      amount: 50000,
      merchant: 'Wire Service',
      city: 'Bangkok',
      country: 'TH',
      category: 'transfer',
      deviceId: 'unknown_device_th',
      timestamp: new Date(baseTime.getTime() + 15 * 60 * 1000), // 15 mins later
      type: 'fraud',
    },
  ];

  return {
    name: 'Account Takeover',
    description: 'Login from new country + immediate large transfer',
    transactions,
    expectedAlerts: [
      'location_critical',
      'amount_critical',
      'account_takeover',
    ],
    expectedTrustDelta: -50,
    detectionDifficulty: 'Easy', // Should be blocked immediately
  };
};

/**
 * Generate merchant fraud scenario
 * Transaction to known-risky merchant category
 * @param {string} userId - User ID
 * @param {Object} baseTransaction - Base transaction
 * @returns {Object} { transactions, expectedAlerts, expectedTrustDelta }
 */
export const generateMerchantFraudScenario = (userId, baseTransaction = {}) => {
  const baseTime = new Date(baseTransaction.timestamp || Date.now());

  // Risky merchant that hasn't been used before
  const transactions = [
    {
      userId,
      amount: 10000,
      merchant: 'Crypto Exchange XYZ',
      city: 'Unknown',
      country: 'Unknown',
      category: 'crypto_transfer', // New category
      deviceId: baseTransaction.deviceId || 'device_1',
      timestamp: new Date(baseTime.getTime()),
      type: 'suspicious',
    },
  ];

  return {
    name: 'Merchant Fraud',
    description: 'Transaction to known-risky merchant category',
    transactions,
    expectedAlerts: [
      'merchant_risk',
      'category_anomaly',
    ],
    expectedTrustDelta: -15,
    detectionDifficulty: 'Medium', // Needs merchant category analysis
  };
};

/**
 * Generate velocity attack scenario
 * 10+ transactions in 5 minutes
 * @param {string} userId - User ID
 * @param {Object} baseTransaction - Base transaction
 * @returns {Object} { transactions, expectedAlerts, expectedTrustDelta }
 */
export const generateVelocityAttackScenario = (userId, baseTransaction = {}) => {
  const baseTime = new Date(baseTransaction.timestamp || Date.now());
  const merchants = ['Online Store', 'Digital Services', 'Payment Gateway', 'API Charge'];

  const transactions = [];

  // 12 transactions in 5 minutes
  for (let i = 0; i < 12; i++) {
    const timestamp = new Date(baseTime.getTime() + i * 25 * 1000); // 25 seconds apart
    transactions.push({
      userId,
      amount: 500 + Math.random() * 1000, // Varied amounts
      merchant: merchants[i % merchants.length],
      city: 'Virtual',
      country: 'IN',
      category: 'online',
      deviceId: baseTransaction.deviceId || 'device_automated',
      timestamp,
      type: 'fraud',
    });
  }

  return {
    name: 'Velocity Attack',
    description: '10+ transactions in 5 minutes - automated attack pattern',
    transactions,
    expectedAlerts: [
      'velocity_critical',
      'frequency_anomaly',
    ],
    expectedTrustDelta: -40,
    detectionDifficulty: 'Very Easy', // Should be caught immediately by rate limiting
  };
};

/**
 * Generate late-night shopping spree scenario
 * Multiple transactions between 2-4 AM (suspicious time)
 * @param {string} userId - User ID
 * @returns {Object} { transactions, expectedAlerts, expectedTrustDelta }
 */
export const generateLateNightScenario = (userId) => {
  const baseTime = new Date();
  baseTime.setHours(2, 0, 0, 0); // Start at 2 AM

  const merchants = ['Online Store A', 'Gaming Site', 'Digital Services'];
  const transactions = [];

  for (let i = 0; i < 3; i++) {
    transactions.push({
      userId,
      amount: 2000 + Math.random() * 5000,
      merchant: merchants[i],
      city: 'Virtual',
      country: 'IN',
      category: 'online',
      deviceId: `device_${i}`,
      timestamp: new Date(baseTime.getTime() + i * 30 * 60 * 1000), // 30 mins apart
      type: 'suspicious',
    });
  }

  return {
    name: 'Late Night Shopping Spree',
    description: 'Multiple transactions at unusual hours (2-4 AM)',
    transactions,
    expectedAlerts: [
      'time_anomaly',
      'frequency_anomaly',
    ],
    expectedTrustDelta: -15,
    detectionDifficulty: 'Medium', // Time-based detection
  };
};

/**
 * Generate normal scenario (control)
 * Regular transaction matching user pattern
 * @param {string} userId - User ID
 * @param {Object} baseTransaction - Base transaction
 * @returns {Object} { transactions, expectedAlerts, expectedTrustDelta }
 */
export const generateNormalScenario = (userId, baseTransaction = {}) => {
  const transactions = [
    {
      userId,
      amount: baseTransaction.amount || 500,
      merchant: baseTransaction.merchant || 'Zomato',
      city: baseTransaction.city || 'Mumbai',
      country: baseTransaction.country || 'IN',
      category: baseTransaction.category || 'food',
      deviceId: baseTransaction.deviceId || 'known_device',
      timestamp: baseTransaction.timestamp || new Date(),
      type: 'normal',
    },
  ];

  return {
    name: 'Normal Transaction',
    description: 'Regular transaction matching established patterns',
    transactions,
    expectedAlerts: [],
    expectedTrustDelta: 2,
    detectionDifficulty: 'N/A',
  };
};

/**
 * Master scenario generator
 * @param {string} scenarioType - Type of scenario to generate
 * @param {string} userId - User ID
 * @param {Object} baseTransaction - Base transaction data
 * @returns {Object} Fraud scenario with expected outcomes
 */
export const generateFraudScenario = (scenarioType, userId, baseTransaction = {}) => {
  const scenarios = {
    card_cloning: () => generateCardCloningScenario(userId, baseTransaction),
    account_takeover: () => generateAccountTakeoverScenario(userId, baseTransaction),
    merchant_fraud: () => generateMerchantFraudScenario(userId, baseTransaction),
    velocity_attack: () => generateVelocityAttackScenario(userId, baseTransaction),
    late_night_spree: () => generateLateNightScenario(userId),
    normal: () => generateNormalScenario(userId, baseTransaction),
  };

  const scenario = scenarios[scenarioType]?.();

  if (!scenario) {
    throw new Error(`Unknown scenario type: ${scenarioType}`);
  }

  // Calculate expected fraud scores for each transaction
  scenario.transactionScores = scenario.transactions.map((txn) => {
    const fraudScore = calculateFraudScore(50); // Mock trust analysis
    return {
      merchant: txn.merchant,
      fraudScore: fraudScore.toFixed(3),
      expectedDecision: fraudScore > 0.7 ? 'BLOCK' : fraudScore > 0.4 ? 'REVIEW' : 'APPROVE',
    };
  });

  return scenario;
};

/**
 * Get all available scenarios
 * @returns {Array} List of available scenario types
 */
export const getAvailableScenarios = () => [
  { type: 'normal', name: 'Normal Transaction', difficulty: 'N/A' },
  { type: 'card_cloning', name: 'Card Cloning', difficulty: 'Easy' },
  { type: 'account_takeover', name: 'Account Takeover', difficulty: 'Easy' },
  { type: 'merchant_fraud', name: 'Merchant Fraud', difficulty: 'Medium' },
  { type: 'velocity_attack', name: 'Velocity Attack', difficulty: 'Very Easy' },
  { type: 'late_night_spree', name: 'Late Night Shopping Spree', difficulty: 'Medium' },
];

export default {
  generateFraudScenario,
  getAvailableScenarios,
  generateCardCloningScenario,
  generateAccountTakeoverScenario,
  generateMerchantFraudScenario,
  generateVelocityAttackScenario,
  generateLateNightScenario,
  generateNormalScenario,
};
