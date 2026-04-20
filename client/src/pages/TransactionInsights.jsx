import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, TrendingUp } from 'lucide-react';
import { transactionAPI } from '../utils/api';
import { useTheme } from '../hooks/useTheme';

export default function TransactionInsights({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    flaggedCount: 0,
    flaggedPercent: 0,
    avgAmount: 0,
    highestAmount: 0,
  });

  const [filters, setFilters] = useState({
    riskLevel: 'all',
    category: 'all',
    minAmount: 0,
    maxAmount: 5000,
  });

  useEffect(() => {
    loadTransactions();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [filters, transactions]);

  const loadTransactions = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const data = await transactionAPI.getTransactions(user.id, 50, 0);
      const txns = data.transactions || [];
      setTransactions(txns);

      if (txns.length > 0) {
        const flagged = txns.filter(t => t.isFlagged || t.fraudScore > 0.75).length;
        const avg = Math.round(txns.reduce((s, t) => s + t.amount, 0) / txns.length);
        const highest = Math.max(...txns.map(t => t.amount));
        setStats({
          total: txns.length,
          flaggedCount: flagged,
          flaggedPercent: Math.round((flagged / txns.length) * 100),
          avgAmount: avg,
          highestAmount: highest,
        });
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = transactions;

    if (filters.riskLevel !== 'all') {
      filtered = filtered.filter(t => {
        const score = t.fraudScore || 0;
        if (filters.riskLevel === 'high') return score > 0.75;
        if (filters.riskLevel === 'medium') return score > 0.5 && score <= 0.75;
        if (filters.riskLevel === 'low') return score <= 0.5;
        return true;
      });
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    filtered = filtered.filter(
      t => t.amount >= filters.minAmount && t.amount <= filters.maxAmount
    );

    setFilteredTransactions(filtered);
  };

  const getRiskBadge = (score) => {
    const s = score || 0;
    if (s > 0.75) return { label: '🔴 High Risk', color: 'bg-red-100 text-red-700' };
    if (s > 0.5) return { label: '🟡 Medium Risk', color: 'bg-amber-100 text-amber-700' };
    return { label: '🟢 Low Risk', color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-clay-900 dark:text-white mb-2">Transaction Insights</h1>
        <p className="text-clay-600 dark:text-slate-400">Detailed history and analysis of your transactions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <div className="clay-card p-3 sm:p-4">
          <p className="text-xs text-clay-600 dark:text-slate-400 mb-1">Total Transactions</p>
          <p className="text-xl sm:text-2xl font-bold text-clay-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="clay-card p-3 sm:p-4">
          <p className="text-xs text-clay-600 dark:text-slate-400 mb-1">Flagged</p>
          <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.flaggedCount}</p>
          <p className="text-xs text-clay-600 dark:text-slate-400">{stats.flaggedPercent}%</p>
        </div>
        <div className="clay-card p-3 sm:p-4">
          <p className="text-xs text-clay-600 dark:text-slate-400 mb-1">Avg Amount</p>
          <p className="text-xl sm:text-2xl font-bold text-clay-900 dark:text-white">${stats.avgAmount}</p>
        </div>
        <div className="clay-card p-3 sm:p-4">
          <p className="text-xs text-clay-600 dark:text-slate-400 mb-1">Highest</p>
          <p className="text-xl sm:text-2xl font-bold text-clay-900 dark:text-white">${stats.highestAmount}</p>
        </div>
        <div className="clay-card p-3 sm:p-4">
          <p className="text-xs text-clay-600 dark:text-slate-400 mb-1">Clean Rate</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600">{100 - stats.flaggedPercent}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="clay-card p-4 sm:p-6">
        <h2 className="text-lg font-bold text-clay-900 dark:text-white mb-4">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-semibold text-clay-900 dark:text-white mb-2">Risk Level</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
              className="clay-input w-full text-sm"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">🔴 High Risk</option>
              <option value="medium">🟡 Medium Risk</option>
              <option value="low">🟢 Low Risk</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-clay-900 dark:text-white mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="clay-input w-full text-sm"
            >
              <option value="all">All Categories</option>
              <option value="shopping">Shopping</option>
              <option value="dining">Dining</option>
              <option value="utilities">Utilities</option>
              <option value="entertainment">Entertainment</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-clay-900 dark:text-white mb-2">Min Amount</label>
            <input
              type="number"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: Number(e.target.value) })}
              className="clay-input w-full text-sm"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-clay-900 dark:text-white mb-2">Max Amount</label>
            <input
              type="number"
              value={filters.maxAmount}
              onChange={(e) => setFilters({ ...filters, maxAmount: Number(e.target.value) })}
              className="clay-input w-full text-sm"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="clay-card p-4 sm:p-6">
        <h2 className="text-lg font-bold text-clay-900 dark:text-white mb-4">
          Transactions ({filteredTransactions.length})
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clay-700 dark:border-slate-400"></div>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="space-y-2 overflow-x-auto">
            {filteredTransactions.map((txn) => {
              const isExpanded = expandedId === txn.id;
              const riskBadge = getRiskBadge(txn.fraudScore);
              return (
                <div key={txn.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : txn.id)}
                    className="w-full p-3 sm:p-4 bg-clay-50 dark:bg-slate-700 hover:bg-clay-100 dark:hover:bg-slate-600 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 sm:gap-2 md:gap-3 lg:gap-4 items-center text-xs sm:text-sm">
                        <div>
                          <p className="text-clay-600 dark:text-slate-400">
                            {new Date(txn.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-clay-900 dark:text-white">${txn.amount}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-clay-700 dark:text-slate-300 truncate">{txn.location}</p>
                        </div>
                        <div className="hidden md:block">
                          <p className="text-clay-700 dark:text-slate-300 capitalize">{txn.category}</p>
                        </div>
                        <div className="flex justify-end">
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${riskBadge.color}`}
                          >
                            {riskBadge.label}
                          </span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-clay-700 dark:text-slate-400 ml-2 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-clay-700 dark:text-slate-400 ml-2 flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-3 sm:p-4 bg-clay-50 dark:bg-slate-700 border-l-4 border-clay-300 dark:border-slate-600 mt-1 rounded-lg">
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <p className="text-xs text-clay-600 dark:text-slate-400">Device</p>
                            <p className="font-semibold text-clay-900 dark:text-white">{txn.deviceName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-clay-600 dark:text-slate-400">Time</p>
                            <p className="font-semibold text-clay-900 dark:text-white">
                              {new Date(txn.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>

                        {txn.fraudScore !== undefined && (
                          <div>
                            <p className="text-xs text-clay-600 mb-2">Fraud Analysis</p>
                            <div className="bg-white p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-clay-900">Risk Score:</span>
                                <span className="text-lg font-bold text-clay-900">
                                  {(txn.fraudScore * 100).toFixed(0)}%
                                </span>
                              </div>
                              {txn.summary?.confidenceScore && (
                                <p className="text-sm text-clay-700">
                                  Confidence: {txn.summary.confidenceScore}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {txn.explanations && txn.explanations.length > 0 && (
                          <div>
                            <p className="text-xs text-clay-600 mb-2">Analysis Details:</p>
                            <div className="space-y-2">
                              {txn.explanations.slice(0, 3).map((exp, i) => (
                                <div
                                  key={i}
                                  className="text-sm text-clay-700 p-2 bg-white rounded-lg"
                                >
                                  • {exp.detail || exp.factor || (typeof exp === 'string' ? exp : 'An anomaly was detected')}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-clay-600">
                            Status:{' '}
                            <span className="font-semibold">
                              {txn.isFlagged || txn.fraudScore > 0.75
                                ? '🚩 Flagged'
                                : '✅ Approved'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-clay-300 mb-4" />
            <p className="text-clay-600">No transactions match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
