/**
 * Data Generation Controller
 * Endpoints for generating and managing synthetic transaction data
 */

import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import SyntheticDataGenerator from '../utils/syntheticDataGenerator.js';
import ProfileCalculator from '../utils/profileCalculator.js';

// Helper functions
function groupByCategory(transactions) {
  const grouped = {};
  transactions.forEach(t => {
    grouped[t.category] = (grouped[t.category] || 0) + 1;
  });
  return grouped;
}

function groupByLocation(transactions) {
  const grouped = {};
  transactions.forEach(t => {
    grouped[t.location] = (grouped[t.location] || 0) + 1;
  });
  return Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .reduce((acc, [loc, count]) => ({ ...acc, [loc]: count }), {});
}

function groupByDevice(transactions) {
  const grouped = {};
  transactions.forEach(t => {
    const key = t.deviceName || t.deviceId;
    grouped[key] = (grouped[key] || 0) + 1;
  });
  return grouped;
}

/**
 * POST /api/data/generate
 * Generate synthetic transaction data for a user
 * Body: { userId, profileType, transactionCount }
 */
export const generateSyntheticData = async (req, res) => {
  try {
    const { userId, profileType = 'moderateSpender', transactionCount = 200 } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (transactionCount < 50 || transactionCount > 500) {
      return res.status(400).json({ error: 'transactionCount must be between 50 and 500' });
    }

    // Check user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`Generating ${transactionCount} synthetic transactions for user ${userId}`);

    const generator = new SyntheticDataGenerator();

    // Generate behavioral profile
    const behavioralProfile = generator.generateUserProfile(profileType);

    // Generate transactions
    const transactions = generator.generateTransactions(
      userId,
      behavioralProfile,
      transactionCount,
      new Date()
    );

    // Delete existing transactions for this user
    const deletedCount = await Transaction.deleteMany({ userId });
    console.log(`Deleted ${deletedCount.deletedCount} existing transactions`);

    // Insert new transactions
    const inserted = await Transaction.insertMany(transactions);
    console.log(`Inserted ${inserted.length} new transactions`);

    // Update user behavioral profile with real calculations
    const updatedProfile = await ProfileCalculator.calculateBehavioralProfile(userId);
    user.behavioralProfile = updatedProfile;
    user.behavioralProfile.profileConfidence = 0.95;
    await user.save();
    console.log(`Updated user profile`);

    // Calculate statistics
    const fraudTransactions = transactions.filter(t => t.isFlagged).length;
    const avgAmount = (transactions.reduce((s, t) => s + t.amount, 0) / transactions.length).toFixed(2);

    const stats = {
      fraudTransactions,
      fraudRate: ((fraudTransactions / transactions.length) * 100).toFixed(2),
      avgAmount,
      locations: behavioralProfile.primaryLocations,
      deviceLoyalty: (behavioralProfile.deviceLoyalty * 100).toFixed(0),
    };

    res.json({
      success: true,
      userId,
      profileType,
      transactionCount,
      deletedCount: deletedCount.deletedCount,
      insertedCount: inserted.length,
      stats,
      message: `Generated ${transactionCount} synthetic transactions for ${profileType} profile`,
    });
  } catch (error) {
    console.error('Data generation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/data/generate-multi
 * Generate synthetic data for multiple customer profiles
 */
export const generateMultipleProfiles = async (req, res) => {
  try {
    const generator = new SyntheticDataGenerator();
    const results = [];

    const profiles = [
      { email: 'low-spender@trustlens.demo', profileType: 'lowSpender', count: 150 },
      { email: 'moderate-spender@trustlens.demo', profileType: 'moderateSpender', count: 250 },
      { email: 'high-spender@trustlens.demo', profileType: 'highSpender', count: 200 },
      { email: 'business-user@trustlens.demo', profileType: 'businessUser', count: 300 },
      { email: 'international@trustlens.demo', profileType: 'internationalTraveler', count: 200 },
    ];

    for (const profile of profiles) {
      try {
        let user = await User.findOne({ email: profile.email });

        if (!user) {
          user = new User({
            email: profile.email,
            passwordHash: '$2b$10$dummy',
            trustScore: 85,
            riskLevel: 'low',
            accountStatus: 'active',
          });
          await user.save();
        }

        const behavioralProfile = generator.generateUserProfile(profile.profileType);
        const transactions = generator.generateTransactions(
          user._id,
          behavioralProfile,
          profile.count,
          new Date()
        );

        const deleted = await Transaction.deleteMany({ userId: user._id });
        const inserted = await Transaction.insertMany(transactions);

        const updatedProfile = await ProfileCalculator.calculateBehavioralProfile(user._id);
        user.behavioralProfile = updatedProfile;
        user.behavioralProfile.profileConfidence = 0.95;
        await user.save();

        const fraudCount = transactions.filter(t => t.isFlagged).length;

        results.push({
          email: profile.email,
          profileType: profile.profileType,
          userId: user._id.toString(),
          transactionsGenerated: inserted.length,
          fraudTransactions: fraudCount,
          fraudRate: `${((fraudCount / transactions.length) * 100).toFixed(2)}%`,
        });

        console.log(`✓ Generated ${profile.profileType}: ${inserted.length} transactions`);
      } catch (err) {
        console.error(`Error processing ${profile.email}:`, err);
        results.push({
          email: profile.email,
          error: err.message,
        });
      }
    }

    const totalTransactions = results.reduce((sum, r) => sum + (r.transactionsGenerated || 0), 0);

    res.json({
      success: true,
      profilesGenerated: results.length,
      totalTransactions,
      results,
      message: `Generated synthetic data for ${results.length} customer profiles`,
    });
  } catch (error) {
    console.error('Multi-profile generation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/data/:userId
 * Clear all synthetic transactions for a user
 */
export const clearSyntheticData = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deletedResult = await Transaction.deleteMany({ userId });

    // Reset behavioral profile
    user.behavioralProfile = {
      typicalHours: {
        distribution: Array(24).fill(1 / 24),
        mean: 12,
        std: 6,
        mode: 15,
      },
      typicalDays: {
        distribution: [1 / 7, 1 / 7, 1 / 7, 1 / 7, 1 / 7, 1 / 7, 1 / 7],
        businessDaysOnly: false,
        weekendRate: 2 / 7,
      },
      amountStats: {
        mean: 100,
        median: 75,
        stdDev: 100,
        p25: 30,
        p50: 75,
        p75: 150,
        p95: 400,
        p99: 1000,
        minAmount: 5,
        maxAmount: 5000,
        rangeLabel: 'moderate',
      },
      categoryPreferences: new Map(),
      velocityMetrics: {
        maxPerHour: 5,
        maxPerDay: 20,
        maxPerWeek: 50,
        typicalPerDay: 1,
      },
      primaryLocations: [],
      usualCountries: ['US'],
      newLocationFrequency: 0.1,
      travelPattern: 'mostly_local',
      deviceCount: 0,
      deviceLoyalty: 0,
      deviceRotation: 1,
      totalTransactions: 0,
      transactionVelocity: 0,
      fraudFlagCount: 0,
      fraudFlagRate: 0,
      profileConfidence: 0,
    };

    await user.save();

    res.json({
      success: true,
      userId,
      deletedTransactions: deletedResult.deletedCount,
      message: `Cleared ${deletedResult.deletedCount} transactions for user ${userId}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/data/stats/:userId
 * Get statistics about a user's transactions
 */
export const getDataStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = await Transaction.find({ userId });
    const fraudTransactions = transactions.filter(t => t.isFlagged);

    const stats = {
      userId,
      totalTransactions: transactions.length,
      fraudTransactions: fraudTransactions.length,
      fraudRate: transactions.length > 0 ? ((fraudTransactions.length / transactions.length) * 100).toFixed(2) : 0,
      avgAmount: transactions.length > 0 ? (transactions.reduce((s, t) => s + t.amount, 0) / transactions.length).toFixed(2) : 0,
      minAmount: transactions.length > 0 ? Math.min(...transactions.map(t => t.amount)).toFixed(2) : 0,
      maxAmount: transactions.length > 0 ? Math.max(...transactions.map(t => t.amount)).toFixed(2) : 0,
      categories: groupByCategory(transactions),
      locations: groupByLocation(transactions),
      devices: groupByDevice(transactions),
      profile: {
        profileConfidence: user.behavioralProfile?.profileConfidence || 0,
        deviceLoyalty: user.behavioralProfile?.deviceLoyalty || 0,
        newLocationFrequency: user.behavioralProfile?.newLocationFrequency || 0,
        travelPattern: user.behavioralProfile?.travelPattern || 'unknown',
      },
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  generateSyntheticData,
  generateMultipleProfiles,
  clearSyntheticData,
  getDataStats,
};
