/**
 * Synthetic Data Generator
 * Generates realistic Indian banking transactions for testing
 */

/**
 * Indian cities for transaction generation
 */
const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
  'Indore',
  'Lucknow',
];

/**
 * Popular Indian merchants by category
 */
const MERCHANTS_BY_CATEGORY = {
  food: ['Zomato', 'Swiggy', 'Dunzo', 'Hotel Radisson', 'Cafe Coffee Day'],
  travel: ['MakeMyTrip', 'Cleartrip', 'IRCTC', 'Uber', 'Ola Cabs'],
  shopping: ['Amazon', 'Flipkart', 'Myntra', 'Nykaa', 'Uniqlo India'],
  utilities: ['BSNL Bill', 'Electricity Board', 'Water Board', 'Gas Provider'],
  entertainment: ['BookMyShow', 'Netflix India', 'Amazon Prime', 'Spotify'],
  atm: ['SBI ATM', 'HDFC ATM', 'ICICI ATM', 'Axis ATM'],
};

/**
 * Realistic amount ranges per category (in INR)
 */
const AMOUNT_RANGES = {
  food: { min: 50, max: 800 },
  travel: { min: 200, max: 15000 },
  shopping: { min: 100, max: 20000 },
  utilities: { min: 100, max: 5000 },
  entertainment: { min: 50, max: 2000 },
  atm: { min: 1000, max: 10000 },
};

/**
 * Generate realistic transaction amount
 * @param {string} category - Transaction category
 * @returns {number} Amount in INR
 */
const generateAmount = (category = 'shopping') => {
  const range = AMOUNT_RANGES[category] || { min: 100, max: 5000 };
  const min = Math.ceil(range.min);
  const max = Math.floor(range.max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate random merchant from category
 * @param {string} category - Transaction category
 * @returns {string} Merchant name
 */
const getRandomMerchant = (category = 'shopping') => {
  const merchants = MERCHANTS_BY_CATEGORY[category] || ['Unknown Merchant'];
  return merchants[Math.floor(Math.random() * merchants.length)];
};

/**
 * Generate random city
 * @returns {string} City name
 */
const getRandomCity = () => {
  return INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)];
};

/**
 * Generate realistic transaction
 * @param {string} userId - User ID
 * @param {string} type - 'normal', 'suspicious', or 'fraudulent'
 * @param {Object} options - Additional options
 * @returns {Object} Transaction object
 */
export const generateSingleTransaction = (userId, type = 'normal', options = {}) => {
  const categories = Object.keys(MERCHANTS_BY_CATEGORY);
  const category = options.category || categories[Math.floor(Math.random() * categories.length)];
  const merchant = getRandomMerchant(category);
  const city = options.city || getRandomCity();
  const amount = options.amount || generateAmount(category);

  // Determine timestamp
  let timestamp;
  if (type === 'normal') {
    // Normal transactions during business hours (8am-10pm)
    const hour = Math.floor(Math.random() * 15) + 8;
    timestamp = new Date();
    timestamp.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  } else if (type === 'suspicious') {
    // Slightly unusual times or amounts
    const hour = Math.floor(Math.random() * 24);
    timestamp = new Date();
    timestamp.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  } else {
    // Fraudulent: often late night
    const hour = Math.floor(Math.random() * 8); // 0-7am
    timestamp = new Date();
    timestamp.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  }

  return {
    userId,
    amount,
    merchant,
    category,
    city,
    country: 'IN',
    type,
    status: type === 'fraudulent' ? 'flagged' : 'completed',
    timestamp,
    deviceId: `device_${Math.floor(Math.random() * 5)}`, // 5 common devices
    isFlagged: type === 'fraudulent',
    fraudScore: type === 'fraudulent' ? 0.8 + Math.random() * 0.2 : Math.random() * 0.3,
  };
};

/**
 * Generate bulk transactions for a user
 * @param {string} userId - User ID
 * @param {number} count - Number of transactions to generate
 * @param {Object} options - Generation options
 * @returns {Array} Array of transaction objects
 */
export const generateUserTransactions = (userId, count = 50, options = {}) => {
  const transactions = [];

  // Distribution: 85% normal, 10% suspicious, 5% fraudulent
  const normalCount = Math.floor(count * 0.85);
  const suspiciousCount = Math.floor(count * 0.1);
  const fraudCount = count - normalCount - suspiciousCount;

  // Generate normal transactions
  for (let i = 0; i < normalCount; i++) {
    transactions.push(generateSingleTransaction(userId, 'normal', options));
  }

  // Generate suspicious transactions
  for (let i = 0; i < suspiciousCount; i++) {
    transactions.push(generateSingleTransaction(userId, 'suspicious', options));
  }

  // Generate fraudulent transactions
  for (let i = 0; i < fraudCount; i++) {
    transactions.push(generateSingleTransaction(userId, 'fraudulent', options));
  }

  // Shuffle and spread across last 90 days
  transactions.sort(() => 0.5 - Math.random());

  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  transactions.forEach((txn, index) => {
    const daysOffset = Math.floor((index / count) * 90);
    const txnDate = new Date(ninetyDaysAgo + daysOffset * 24 * 60 * 60 * 1000);
    txnDate.setHours(txn.timestamp.getHours(), txn.timestamp.getMinutes());
    txn.timestamp = txnDate;
  });

  return transactions;
};

/**
 * Generate multiple user profiles with transactions
 * @param {number} userCount - Number of users to generate
 * @param {number} transactionsPerUser - Transactions per user
 * @returns {Array} Array of { user, transactions }
 */
export const generateMultipleProfiles = (userCount = 10, transactionsPerUser = 50) => {
  const profiles = [];

  for (let i = 0; i < userCount; i++) {
    const userId = `user_${Date.now()}_${i}`;
    const email = `user${i}@example.com`;

    const profile = {
      user: {
        id: userId,
        email,
        name: `User ${i}`,
        trustScore: Math.floor(Math.random() * 50) + 50, // 50-100
        accountAge: Math.floor(Math.random() * 365), // 0-365 days
        behavioralProfile: {
          totalTransactions: transactionsPerUser,
          avgTransactionAmount: 2000 + Math.random() * 5000,
          consistencyScore: 0.5 + Math.random() * 0.5,
        },
      },
      transactions: generateUserTransactions(userId, transactionsPerUser),
    };

    profiles.push(profile);
  }

  return profiles;
};

/**
 * Generate specific merchant scenarios
 * @param {string} userId - User ID
 * @returns {Object} Transactions with specific merchant patterns
 */
export const generateMerchantScenarios = (userId) => {
  return {
    foodDeliveryHabits: [
      generateSingleTransaction(userId, 'normal', {
        category: 'food',
        merchant: 'Zomato',
        amount: 300,
      }),
      generateSingleTransaction(userId, 'normal', {
        category: 'food',
        merchant: 'Swiggy',
        amount: 400,
      }),
    ],
    travelPatterns: [
      generateSingleTransaction(userId, 'normal', {
        category: 'travel',
        merchant: 'Uber',
        amount: 200,
      }),
      generateSingleTransaction(userId, 'normal', {
        category: 'travel',
        merchant: 'IRCTC',
        amount: 5000,
      }),
    ],
    onlineShopping: [
      generateSingleTransaction(userId, 'normal', {
        category: 'shopping',
        merchant: 'Amazon',
        amount: 3000,
      }),
      generateSingleTransaction(userId, 'normal', {
        category: 'shopping',
        merchant: 'Flipkart',
        amount: 2500,
      }),
    ],
  };
};

/**
 * Generate demo data for specific user profiles
 * @param {string} profileType - Type of user profile
 * @param {string} userId - User ID
 * @returns {Object} { user, transactions }
 */
export const generateUserProfile = (profileType = 'moderate_spender', userId) => {
  const profiles = {
    low_spender: {
      name: 'Low Spender',
      avgAmount: 500,
      frequency: 20,
      category: ['food', 'utilities'],
      trustScore: 85,
      transactions: 50,
    },
    moderate_spender: {
      name: 'Moderate Spender',
      avgAmount: 2000,
      frequency: 30,
      category: Object.keys(MERCHANTS_BY_CATEGORY),
      trustScore: 75,
      transactions: 80,
    },
    high_spender: {
      name: 'High Spender',
      avgAmount: 5000,
      frequency: 40,
      category: Object.keys(MERCHANTS_BY_CATEGORY),
      trustScore: 70,
      transactions: 120,
    },
    business_user: {
      name: 'Business User',
      avgAmount: 10000,
      frequency: 50,
      category: ['travel', 'shopping', 'utilities'],
      trustScore: 80,
      transactions: 150,
    },
    international_traveler: {
      name: 'International Traveler',
      avgAmount: 8000,
      frequency: 35,
      category: ['travel', 'entertainment', 'food'],
      trustScore: 60,
      transactions: 100,
    },
  };

  const profileConfig = profiles[profileType] || profiles.moderate_spender;

  const transactions = [];
  for (let i = 0; i < profileConfig.transactions; i++) {
    const category = profileConfig.category[
      Math.floor(Math.random() * profileConfig.category.length)
    ];
    transactions.push(
      generateSingleTransaction(userId, 'normal', {
        category,
        amount: Math.floor(profileConfig.avgAmount * (0.5 + Math.random())),
      })
    );
  }

  return {
    user: {
      id: userId,
      email: `${profileType}@trustlens.demo`,
      name: profileConfig.name,
      trustScore: profileConfig.trustScore,
      accountAge: Math.floor(Math.random() * 365),
      behavioralProfile: {
        totalTransactions: profileConfig.transactions,
        avgTransactionAmount: profileConfig.avgAmount,
        consistencyScore: 0.7 + Math.random() * 0.3,
      },
    },
    transactions,
  };
};

/**
 * Export all available profile types
 */
export const AVAILABLE_PROFILES = [
  'low_spender',
  'moderate_spender',
  'high_spender',
  'business_user',
  'international_traveler',
];

export default {
  generateSingleTransaction,
  generateUserTransactions,
  generateMultipleProfiles,
  generateMerchantScenarios,
  generateUserProfile,
  AVAILABLE_PROFILES,
  INDIAN_CITIES,
  MERCHANTS_BY_CATEGORY,
  AMOUNT_RANGES,
};
