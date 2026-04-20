import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react';

const SAMPLE_ALERTS = [
  {
    id: 1,
    type: 'high',
    title: 'Unusual Transaction Pattern',
    description: 'Transaction of $2,450 from Chicago detected - 3.2x your average. Requires verification.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    actions: ['View Details', 'Dismiss', 'Appeal'],
    resolved: false,
  },
  {
    id: 2,
    type: 'medium',
    title: 'New Device Detected',
    description: 'A new device (Samsung Galaxy S24) was used to access your account.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    actions: ['Verify Device', 'Dismiss'],
    resolved: false,
  },
  {
    id: 3,
    type: 'medium',
    title: 'Location Change',
    description: 'Transaction detected from Miami, FL. You typically transact from New York.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    actions: ['Add Location', 'Dismiss'],
    resolved: false,
  },
  {
    id: 4,
    type: 'low',
    title: 'Weekly Spending Report',
    description: 'Your spending this week: $1,245 across 8 transactions. Average: $156 per transaction.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    actions: ['View Report'],
    resolved: true,
  },
  {
    id: 5,
    type: 'low',
    title: 'Account Health Update',
    description: 'Account health score improved to 8.5/10. Keep up the good activity patterns!',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    actions: ['View Details'],
    resolved: true,
  },
  {
    id: 6,
    type: 'high',
    title: 'Multiple Failed Login Attempts',
    description: '5 failed login attempts from unknown IP (203.0.113.42) in the last 30 minutes.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    actions: ['Reset Password', 'Dismiss', 'Report'],
    resolved: false,
  },
];

function AlertIcon({ type }) {
  if (type === 'high')
    return <AlertCircle className="w-6 h-6 text-red-600" />;
  if (type === 'medium')
    return <Clock className="w-6 h-6 text-amber-600" />;
  return <CheckCircle className="w-6 h-6 text-green-600" />;
}

function AlertCard({ alert, onDismiss, onAction }) {
  const typeColors = {
    high: 'bg-red-50 border-l-4 border-red-500',
    medium: 'bg-amber-50 border-l-4 border-amber-500',
    low: 'bg-green-50 border-l-4 border-green-500',
  };

  const typeLabels = {
    high: '🔴 High',
    medium: '🟡 Medium',
    low: '🟢 Low',
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={`p-6 rounded-lg ${typeColors[alert.type]}`}>
      <div className="flex items-start gap-4">
        <AlertIcon type={alert.type} />

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-clay-900">{alert.title}</h3>
              <p className="text-xs text-clay-600 mt-1">{formatTime(alert.timestamp)}</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${
              alert.type === 'high'
                ? 'bg-red-100 text-red-700'
                : alert.type === 'medium'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {typeLabels[alert.type]}
            </span>
          </div>

          <p className="text-sm text-clay-700 mb-4">{alert.description}</p>

          <div className="flex flex-wrap gap-2">
            {alert.actions.map((action, i) => (
              <button
                key={i}
                onClick={() => onAction(alert.id, action)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  action === 'Dismiss'
                    ? 'bg-white border-2 border-clay-300 text-clay-900 hover:border-clay-500'
                    : 'bg-gradient-trust-medium text-white hover:shadow-clay-md'
                }`}
              >
                {action}
              </button>
            ))}
          </div>

          {alert.resolved && (
            <div className="mt-3 p-2 bg-green-100 rounded-lg text-xs text-green-700 font-semibold">
              ✅ Resolved
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AlertsCenter() {
  const [alerts, setAlerts] = useState(SAMPLE_ALERTS);
  const [filter, setFilter] = useState('all');

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'high') return alert.type === 'high' && !alert.resolved;
    if (filter === 'medium') return alert.type === 'medium' && !alert.resolved;
    if (filter === 'low') return alert.type === 'low' && !alert.resolved;
    if (filter === 'resolved') return alert.resolved;
    return true;
  });

  const stats = {
    total: alerts.length,
    highCount: alerts.filter(a => a.type === 'high' && !a.resolved).length,
    mediumCount: alerts.filter(a => a.type === 'medium' && !a.resolved).length,
    lowCount: alerts.filter(a => a.type === 'low' && !a.resolved).length,
    resolvedCount: alerts.filter(a => a.resolved).length,
  };

  const handleDismiss = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  const handleAction = (alertId, action) => {
    if (action === 'Dismiss') {
      handleDismiss(alertId);
    } else {
      console.log(`Action: ${action} on alert ${alertId}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-clay-900 mb-2">Alerts Center</h1>
        <p className="text-clay-600">Review and manage your security and account alerts</p>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="clay-card p-4">
          <p className="text-xs text-clay-600 mb-1">Total Alerts</p>
          <p className="text-2xl font-bold text-clay-900">{stats.total}</p>
        </div>
        <div className="clay-card p-4 border-l-4 border-red-500">
          <p className="text-xs text-clay-600 mb-1">🔴 High</p>
          <p className="text-2xl font-bold text-red-600">{stats.highCount}</p>
        </div>
        <div className="clay-card p-4 border-l-4 border-amber-500">
          <p className="text-xs text-clay-600 mb-1">🟡 Medium</p>
          <p className="text-2xl font-bold text-amber-600">{stats.mediumCount}</p>
        </div>
        <div className="clay-card p-4 border-l-4 border-green-500">
          <p className="text-xs text-clay-600 mb-1">🟢 Low</p>
          <p className="text-2xl font-bold text-green-600">{stats.lowCount}</p>
        </div>
        <div className="clay-card p-4 border-l-4 border-blue-500">
          <p className="text-xs text-clay-600 mb-1">✅ Resolved</p>
          <p className="text-2xl font-bold text-blue-600">{stats.resolvedCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All', count: stats.total },
          { id: 'high', label: '🔴 High', count: stats.highCount },
          { id: 'medium', label: '🟡 Medium', count: stats.mediumCount },
          { id: 'low', label: '🟢 Low', count: stats.lowCount },
          { id: 'resolved', label: '✅ Resolved', count: stats.resolvedCount },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === tab.id
                ? 'bg-gradient-trust-medium text-white shadow-clay-md'
                : 'bg-clay-100 text-clay-900 hover:bg-clay-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={handleDismiss}
              onAction={handleAction}
            />
          ))
        ) : (
          <div className="clay-card p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-clay-900 mb-2">All Clear!</p>
            <p className="text-clay-600">No alerts matching your filters. Your account is looking healthy.</p>
          </div>
        )}
      </div>

      {/* Alert Preferences */}
      <div className="clay-card p-6">
        <h2 className="text-lg font-bold text-clay-900 mb-4">Alert Preferences</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 bg-clay-50 rounded-lg cursor-pointer hover:bg-clay-100">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <span className="text-clay-900">High-risk alerts (email + in-app)</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-clay-50 rounded-lg cursor-pointer hover:bg-clay-100">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <span className="text-clay-900">Medium-risk alerts (in-app)</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-clay-50 rounded-lg cursor-pointer hover:bg-clay-100">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <span className="text-clay-900">Weekly activity digest</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-clay-50 rounded-lg cursor-pointer hover:bg-clay-100">
            <input type="checkbox" className="w-5 h-5" />
            <span className="text-clay-900">Low-risk alerts (in-app only)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
