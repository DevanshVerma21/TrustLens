/**
 * Profile Calculator Utility
 * Computes user behavioral profile from transaction history
 * Updates dynamically as new transactions are added
 */

export class ProfileCalculator {
  /**
   * Calculate complete behavioral profile from transaction history
   */
  static calculateProfile(transactions, user) {
    if (!transactions || transactions.length === 0) {
      return this._getDefaultProfile(user);
    }

    const profile = {
      typicalHours: this._calculateHourPatterns(transactions),
      typicalDays: this._calculateDayPatterns(transactions),
      amountStats: this._calculateAmountStats(transactions),
      categoryPreferences: this._calculateCategoryPreferences(transactions),
      velocityMetrics: this._calculateVelocityMetrics(transactions),
      primaryLocations: this._calculatePrimaryLocations(transactions),
      usualCountries: this._calculateCountries(transactions),
      newLocationFrequency: this._calculateNewLocationFrequency(transactions, user),
      travelPattern: this._determineTravelPattern(transactions),
      deviceCount: this._countUniqueDevices(transactions),
      deviceLoyalty: this._calculateDeviceLoyalty(transactions),
      deviceRotation: this._calculateDeviceRotation(transactions),
      accountCreatedDate: user.createdAt || new Date(),
      accountAge: this._calculateAccountAge(user),
      totalTransactions: transactions.length,
      transactionVelocity: this._calculateTransactionVelocity(transactions),
      fraudFlagCount: this._countFraudFlags(transactions),
      fraudFlagRate: this._calculateFraudFlagRate(transactions),
      declinedTransactionCount: this._countDeclinedTransactions(transactions),
      lastAccountReview: new Date(),
      lastProfileUpdate: new Date(),
      profileConfidence: Math.min(1, Math.sqrt(transactions.length / 50)), // More confident with more data
    };

    return profile;
  }

  // ============ PRIVATE: CALCULATION METHODS ============

  /**
   * Calculate hour-of-day patterns
   */
  static _calculateHourPatterns(transactions) {
    const hourCounts = Array(24).fill(0);
    const hours = [];

    transactions.forEach((t) => {
      const hour = new Date(t.timestamp).getHours();
      hourCounts[hour]++;
      hours.push(hour);
    });

    // Normalize to frequencies
    const total = transactions.length;
    const distribution = hourCounts.map((c) => c / total);

    // Calculate statistics
    const mean = hours.reduce((a, b) => a + b, 0) / hours.length;
    const variance = hours.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / hours.length;
    const std = Math.sqrt(variance);
    const mode = hourCounts.indexOf(Math.max(...hourCounts));

    return {
      distribution: distribution.map((d) => parseFloat(d.toFixed(4))),
      mean: parseFloat(mean.toFixed(2)),
      std: parseFloat(std.toFixed(2)),
      mode,
    };
  }

  /**
   * Calculate day-of-week patterns
   */
  static _calculateDayPatterns(transactions) {
    const dayCounts = Array(7).fill(0);
    const days = [];

    transactions.forEach((t) => {
      const day = new Date(t.timestamp).getDay();
      dayCounts[day]++;
      days.push(day);
    });

    // Normalize to frequencies
    const total = transactions.length;
    const distribution = dayCounts.map((c) => c / total);

    // Check if mostly business days (Mon-Fri)
    const businessDayTxns = dayCounts.slice(1, 6).reduce((a, b) => a + b, 0);
    const businessDaysOnly = businessDayTxns / total > 0.9;

    // Weekend rate
    const weekendTxns = dayCounts[0] + dayCounts[6];
    const weekendRate = parseFloat((weekendTxns / total).toFixed(4));

    return {
      distribution: distribution.map((d) => parseFloat(d.toFixed(4))),
      businessDaysOnly,
      weekendRate,
    };
  }

  /**
   * Calculate amount-based statistics
   */
  static _calculateAmountStats(transactions) {
    const amounts = transactions.map((t) => t.amount);
    amounts.sort((a, b) => a - b);

    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const median = amounts.length % 2 === 0 ? (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2 : amounts[Math.floor(amounts.length / 2)];

    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean: parseFloat(mean.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      stdDev: parseFloat(stdDev.toFixed(2)),
      p25: parseFloat(this._percentile(amounts, 0.25).toFixed(2)),
      p50: parseFloat(this._percentile(amounts, 0.5).toFixed(2)),
      p75: parseFloat(this._percentile(amounts, 0.75).toFixed(2)),
      p95: parseFloat(this._percentile(amounts, 0.95).toFixed(2)),
      p99: parseFloat(this._percentile(amounts, 0.99).toFixed(2)),
      minAmount: parseFloat(Math.min(...amounts).toFixed(2)),
      maxAmount: parseFloat(Math.max(...amounts).toFixed(2)),
      rangeLabel: this._getRangeLabel(mean),
    };
  }

  /**
   * Calculate category spending preferences
   */
  static _calculateCategoryPreferences(transactions) {
    const categories = {};

    transactions.forEach((t) => {
      const cat = t.category || 'other';
      if (!categories[cat]) {
        categories[cat] = { amounts: [], count: 0 };
      }
      categories[cat].amounts.push(t.amount);
      categories[cat].count++;
    });

    const preferences = new Map();
    Object.entries(categories).forEach(([cat, data]) => {
      const avgAmount = data.amounts.reduce((a, b) => a + b, 0) / data.count;
      const frequencyLabel = this._getFrequencyLabel(data.count, transactions.length);

      preferences.set(cat, {
        count: data.count,
        avgAmount: parseFloat(avgAmount.toFixed(2)),
        frequency: frequencyLabel,
      });
    });

    return preferences;
  }

  /**
   * Calculate transaction velocity metrics
   */
  static _calculateVelocityMetrics(transactions) {
    const maxPerHour = this._getMaxInTimeWindow(transactions, 60 * 60 * 1000);
    const maxPerDay = this._getMaxInTimeWindow(transactions, 24 * 60 * 60 * 1000);
    const maxPerWeek = this._getMaxInTimeWindow(transactions, 7 * 24 * 60 * 60 * 1000);

    const typicalPerDay = transactions.length > 0
      ? parseFloat((transactions.length / this._getDateSpanDays(transactions)).toFixed(2))
      : 0;

    return {
      maxPerHour: Math.max(1, maxPerHour),
      maxPerDay: Math.max(1, maxPerDay),
      maxPerWeek: Math.max(1, maxPerWeek),
      typicalPerDay: Math.max(0.1, typicalPerDay),
    };
  }

  /**
   * Calculate primary locations (top 5)
   */
  static _calculatePrimaryLocations(transactions) {
    const locationCounts = {};

    transactions.forEach((t) => {
      const loc = t.location;
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    return Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((e) => e[0]);
  }

  /**
   * Extract countries from locations
   */
  static _calculateCountries(transactions) {
    const countries = new Set();

    transactions.forEach((t) => {
      const parts = t.location.split(',');
      const country = parts[parts.length - 1]?.trim() || 'US';
      countries.add(country);
    });

    return Array.from(countries).slice(0, 10); // Top 10 countries
  }

  /**
   * Calculate new location frequency
   */
  static _calculateNewLocationFrequency(transactions, user) {
    if (!user.locationHistory || transactions.length === 0) {
      return 0;
    }

    const userLocations = new Set(user.locationHistory.map((l) => l.location.toLowerCase()));
    const newLocationTxns = transactions.filter(
      (t) => !userLocations.has(t.location.toLowerCase())
    ).length;

    return parseFloat((newLocationTxns / transactions.length).toFixed(4));
  }

  /**
   * Determine travel pattern
   */
  static _determineTravelPattern(transactions) {
    const locations = new Set(transactions.map((t) => t.location));
    const locationCount = locations.size;
    const ratio = locationCount / Math.max(1, Math.sqrt(transactions.length));

    if (ratio < 0.5) return 'mostly_local';
    if (ratio < 1.5) return 'regional';
    return 'global';
  }

  /**
   * Count unique devices
   */
  static _countUniqueDevices(transactions) {
    const devices = new Set(transactions.map((t) => t.deviceId));
    return devices.size;
  }

  /**
   * Calculate device loyalty (% txns on primary device)
   */
  static _calculateDeviceLoyalty(transactions) {
    if (transactions.length === 0) return 0;

    const deviceCounts = {};
    transactions.forEach((t) => {
      deviceCounts[t.deviceId] = (deviceCounts[t.deviceId] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(deviceCounts));
    return parseFloat((maxCount / transactions.length).toFixed(4));
  }

  /**
   * Calculate device rotation (% txns on new devices)
   */
  static _calculateDeviceRotation(transactions) {
    if (transactions.length < 2) return 0;

    // Count how many transactions use a device they only use once
    const deviceUsage = {};
    transactions.forEach((t) => {
      deviceUsage[t.deviceId] = (deviceUsage[t.deviceId] || 0) + 1;
    });

    const oneTimeDeviceTxns = Object.values(deviceUsage).filter((count) => count === 1).length;
    return parseFloat((oneTimeDeviceTxns / transactions.length).toFixed(4));
  }

  /**
   * Calculate account age in days
   */
  static _calculateAccountAge(user) {
    const createdDate = user.createdAt || new Date();
    const ageMs = new Date() - new Date(createdDate);
    return Math.floor(ageMs / (24 * 60 * 60 * 1000));
  }

  /**
   * Calculate transaction velocity (txns per day)
   */
  static _calculateTransactionVelocity(transactions) {
    if (transactions.length === 0) return 0;

    const dateSpanDays = this._getDateSpanDays(transactions);
    return parseFloat((transactions.length / dateSpanDays).toFixed(4));
  }

  /**
   * Count fraud flags in transaction history
   */
  static _countFraudFlags(transactions) {
    return transactions.filter((t) => t.isFlagged).length;
  }

  /**
   * Calculate fraud flag rate
   */
  static _calculateFraudFlagRate(transactions) {
    if (transactions.length === 0) return 0;
    const flagCount = transactions.filter((t) => t.isFlagged).length;
    return parseFloat((flagCount / transactions.length).toFixed(4));
  }

  /**
   * Count declined transactions
   */
  static _countDeclinedTransactions(transactions) {
    return transactions.filter((t) => t.status === 'declined').length;
  }

  // ============ PRIVATE: HELPER METHODS ============

  static _percentile(sortedArray, p) {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil(sortedArray.length * p) - 1;
    return sortedArray[Math.max(0, index)];
  }

  static _getRangeLabel(mean) {
    if (mean < 50) return 'low';
    if (mean < 300) return 'moderate';
    return 'high';
  }

  static _getFrequencyLabel(count, total) {
    const rate = count / total;
    if (rate > 0.4) return 'daily';
    if (rate > 0.15) return 'weekly';
    if (rate > 0.04) return 'monthly';
    return 'quarterly';
  }

  static _getMaxInTimeWindow(transactions, windowMs) {
    const now = new Date();
    let maxCount = 0;
    const sortedTxns = transactions
      .filter((t) => now - new Date(t.timestamp) <= windowMs * 5) // Look back 5 windows
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    for (let i = 0; i < sortedTxns.length; i++) {
      let count = 1;
      for (let j = i + 1; j < sortedTxns.length; j++) {
        if (new Date(sortedTxns[i].timestamp) - new Date(sortedTxns[j].timestamp) < windowMs) {
          count++;
        } else {
          break;
        }
      }
      maxCount = Math.max(maxCount, count);
    }

    return maxCount;
  }

  static _getDateSpanDays(transactions) {
    if (transactions.length === 0) return 1;
    const timestamps = transactions.map((t) => new Date(t.timestamp).getTime());
    const spanMs = Math.max(...timestamps) - Math.min(...timestamps);
    const spanDays = Math.max(1, spanMs / (24 * 60 * 60 * 1000));
    return spanDays;
  }

  /**
   * Get default profile for users with no history
   */
  static _getDefaultProfile(user) {
    return {
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
      accountCreatedDate: user.createdAt || new Date(),
      accountAge: 0,
      totalTransactions: 0,
      transactionVelocity: 0,
      fraudFlagCount: 0,
      fraudFlagRate: 0,
      declinedTransactionCount: 0,
      lastAccountReview: new Date(),
      lastProfileUpdate: new Date(),
      profileConfidence: 0,
    };
  }

  /**
   * Calculate behavioral profile from database transactions
   * Used by seed script and profile update endpoints
   */
  static async calculateBehavioralProfile(userId) {
    const Transaction = (await import('../models/Transaction.js')).default;
    const User = (await import('../models/User.js')).default;

    const user = await User.findById(userId);
    if (!user) throw new Error(`User not found: ${userId}`);

    const transactions = await Transaction.find({ userId }).sort({ timestamp: -1 });

    return this.calculateProfile(transactions, user);
  }
}

export default ProfileCalculator;
