import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, FileText, AlertCircle, Zap } from 'lucide-react';
import { auditAPI } from '../utils/api';

export default function AuditLog({ user }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    challenged: 0,
    declined: 0,
    escalated: 0,
  });

  useEffect(() => {
    loadAuditLogs();
  }, [user, filter]);

  const loadAuditLogs = async () => {
    try {
      if (!user) return;
      setLoading(true);

      const data = await auditAPI.getLogs({
        userId: user.id,
        limit: 50,
        offset: 0,
        decision: filter === 'all' ? undefined : filter,
      });
      const payload = data?.data || data;

      setAuditLogs(payload.logs || []);
      setStats(payload.stats || {});
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDecisionLabel = (decision) => {
    const labels = {
      APPROVE: '✅ Approved',
      CHALLENGE: '🟡 Review Required',
      DECLINE: '🚩 Declined',
      ESCALATE: '⚠️ Escalated',
      HOLD: '⏸️ On Hold',
    };
    return labels[decision] || decision;
  };

  const getRiskBadge = (riskLevel) => {
    const config = {
      LOW: { emoji: '🟢', color: 'bg-green-100 text-green-700' },
      MEDIUM: { emoji: '🟡', color: 'bg-amber-100 text-amber-700' },
      HIGH: { emoji: '🔴', color: 'bg-red-100 text-red-700' },
    };
    const riskConfig = config[riskLevel] || config.MEDIUM;
    return { ...riskConfig, label: riskLevel };
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (filter === 'all') return true;
    return log.decision === filter;
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-clay-900 mb-2">Audit Log</h1>
        <p className="text-clay-600">Complete transaction decision history and reasoning</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="clay-card p-4">
          <p className="text-xs text-clay-600 mb-1">Total Decisions</p>
          <p className="text-2xl font-bold text-clay-900">{stats.total || 0}</p>
        </div>
        <div className="clay-card p-4 border-l-4 border-green-500">
          <p className="text-xs text-clay-600 mb-1">✅ Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved || 0}</p>
        </div>
        <div className="clay-card p-4 border-l-4 border-amber-500">
          <p className="text-xs text-clay-600 mb-1">🟡 Challenged</p>
          <p className="text-2xl font-bold text-amber-600">{stats.challenged || 0}</p>
        </div>
        <div className="clay-card p-4 border-l-4 border-red-500">
          <p className="text-xs text-clay-600 mb-1">🚩 Declined</p>
          <p className="text-2xl font-bold text-red-600">{stats.declined || 0}</p>
        </div>
        <div className="clay-card p-4 border-l-4 border-red-500">
          <p className="text-xs text-clay-600 mb-1">⚠️ Escalated</p>
          <p className="text-2xl font-bold text-red-600">{stats.escalated || 0}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'APPROVE', 'CHALLENGE', 'DECLINE', 'ESCALATE'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === tab
                ? 'bg-gradient-trust-medium text-white shadow-clay-md'
                : 'bg-clay-100 text-clay-900 hover:bg-clay-200'
            }`}
          >
            {tab === 'all' ? 'All Decisions' : getDecisionLabel(tab)}
          </button>
        ))}
      </div>

      {/* Audit logs list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clay-700"></div>
          </div>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const isExpanded = expandedId === log._id;
            const riskBadge = getRiskBadge(log.riskLevel);
            const decisionLabel = getDecisionLabel(log.decision);

            return (
              <div key={log._id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : log._id)}
                  className="w-full p-4 bg-clay-50 hover:bg-clay-100 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-1">
                      {/* Top row: Decision and timestamp */}
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-clay-900">{decisionLabel}</p>
                        <p className="text-xs text-clay-600">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Second row: Amount, Risk, and Trust */}
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-clay-600">Amount:</span>{' '}
                          <span className="font-semibold">${log.transactionDetails?.amount}</span>
                        </div>
                        <div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${riskBadge.color}`}
                          >
                            {riskBadge.emoji} {riskBadge.label}
                          </span>
                        </div>
                        <div>
                          <span className="text-clay-600">Fraud:</span>{' '}
                          <span className="font-semibold">{(log.fraudScore * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-clay-600">Confidence:</span>{' '}
                          <span className="font-semibold">{(log.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>

                      {/* System message preview */}
                      <p className="text-sm text-clay-700 italic mt-2">{log.systemMessage}</p>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-clay-700 ml-4" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-clay-700 ml-4" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="p-4 bg-clay-50 border-l-4 border-clay-300 mt-1 rounded-lg space-y-4">
                    {/* Decision reasoning */}
                    <div>
                      <p className="font-semibold text-clay-900 mb-2">Decision Reasoning</p>
                      <div className="space-y-1 text-sm text-clay-700">
                        <p>
                          <strong>Fraud Reason:</strong> {log.reasoning?.fraudReason}
                        </p>
                        <p>
                          <strong>Trust Reason:</strong> {log.reasoning?.trustReason}
                        </p>
                        {log.reasoning?.decisionFactors?.length > 0 && (
                          <div>
                            <strong>Factors:</strong>
                            <ul className="list-disc list-inside ml-2">
                              {log.reasoning.decisionFactors.map((factor, i) => (
                                <li key={i}>{factor}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* User context */}
                    <div>
                      <p className="font-semibold text-clay-900 mb-2">User Context at Decision</p>
                      <div className="space-y-1 text-sm text-clay-700">
                        <p>
                          <strong>Account Status:</strong> {log.userContext?.accountStatus}
                        </p>
                        <p>
                          <strong>Account Age:</strong> {log.userContext?.accountAge} days
                        </p>
                        <p>
                          <strong>Fraud History:</strong> {log.userContext?.fraudHistoryCount}{' '}
                          flags
                        </p>
                        <p>
                          <strong>Typical Amount:</strong> ${log.userContext?.behavioralProfile?.typicalAmountMean?.toFixed(2)}
                        </p>
                        <p>
                          <strong>Primary Locations:</strong>{' '}
                          {log.userContext?.behavioralProfile?.primaryLocations?.join(', ')}
                        </p>
                      </div>
                    </div>

                    {/* Transaction details */}
                    <div>
                      <p className="font-semibold text-clay-900 mb-2">Transaction Details</p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-clay-700">
                        <p>
                          <strong>Amount:</strong> ${log.transactionDetails?.amount}
                        </p>
                        <p>
                          <strong>Location:</strong> {log.transactionDetails?.location}
                        </p>
                        <p>
                          <strong>Category:</strong> {log.transactionDetails?.category}
                        </p>
                        <p>
                          <strong>Device:</strong> {log.transactionDetails?.deviceName}
                        </p>
                        <p className="col-span-2">
                          <strong>Time:</strong>{' '}
                          {new Date(log.transactionDetails?.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Appeal info if applicable */}
                    {log.appeal?.appealed && (
                      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <p className="font-semibold text-blue-900 mb-1">Appeal Status</p>
                        <p className="text-sm text-blue-800">
                          <strong>Status:</strong> {log.appeal?.appealStatus}
                        </p>
                        {log.appeal?.appealReason && (
                          <p className="text-sm text-blue-800 mt-1">
                            <strong>Reason:</strong> {log.appeal.appealReason}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Decision engine metadata */}
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      <p>
                        Decision Engine v{log.decisionEngine?.version} | Model: {log.decisionEngine?.model}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="clay-card p-12 text-center">
            <FileText className="w-12 h-12 text-clay-300 mx-auto mb-4" />
            <p className="text-lg font-semibold text-clay-900 mb-2">No audit logs yet</p>
            <p className="text-clay-600">Transactions will appear here once submitted</p>
          </div>
        )}
      </div>
    </div>
  );
}
