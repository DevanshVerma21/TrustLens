import React, { useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, Clock, Play } from 'lucide-react';
import { transactionAPI } from '../utils/api';
import DecisionBadge from '../components/DecisionBadge';
import SystemMessage from '../components/SystemMessage';
import DemoMode from '../components/DemoMode';

export default function FraudSimulator({ user }) {
  const [formData, setFormData] = useState({
    amount: 100,
    location: 'New York',
    time: 14,
    device: 'known',
    category: 'shopping',
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleSimulate = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const response = await transactionAPI.submit({
        userId: user.id,
        amount: formData.amount,
        location: formData.location,
        deviceId: `device-${formData.device}-${Date.now()}`,
        deviceName: formData.device === 'known' ? 'Windows PC' : 'Unknown Device',
        category: formData.category,
      });

      setResults(response);
    } catch (err) {
      setError('Failed to analyze transaction. Please try again.');
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  }, [formData, user]);

  const getRiskColor = (score) => {
    if (score > 0.75) return 'text-red-600';
    if (score > 0.5) return 'text-amber-600';
    return 'text-green-600';
  };

  const getRiskBg = (score) => {
    if (score > 0.75) return 'bg-red-50 border-red-200';
    if (score > 0.5) return 'bg-amber-50 border-amber-200';
    return 'bg-green-50 border-green-200';
  };

  const getRiskIcon = (score) => {
    if (score > 0.75) return <AlertCircle className="w-8 h-8 text-red-600" />;
    if (score > 0.5) return <Clock className="w-8 h-8 text-amber-600" />;
    return <CheckCircle className="w-8 h-8 text-green-600" />;
  };

  const handleDemoScenarioSelect = (scenario) => {
    setFormData({
      amount: scenario.transaction.amount,
      location: scenario.transaction.location,
      time: scenario.transaction.time,
      device: scenario.transaction.device,
      category: scenario.transaction.category,
    });
    // Auto-simulate after setting data
    setTimeout(() => {
      handleSimulate();
    }, 100);
  };

  return (
    <div className="space-y-8">
      {/* Demo Mode Modal */}
      <DemoMode
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onScenarioSelect={handleDemoScenarioSelect}
      />

      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-clay-900 mb-2">Fraud Simulator</h1>
        <p className="text-clay-600">See how your transactions are analyzed in real-time</p>
        <button
          onClick={() => setIsDemoModalOpen(true)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-clay text-clay-700 font-semibold rounded-lg hover:shadow-clay-md transition-all"
        >
          <Play className="w-4 h-4" />
          🎬 Try Demo Scenarios
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="clay-card p-8">
          <h2 className="text-xl font-bold text-clay-900 mb-6">Transaction Details</h2>

          <div className="space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-clay-900 mb-2">Amount</label>
              <div className="flex gap-2">
                <span className="text-2xl font-bold text-clay-900">$</span>
                <input
                  type="range"
                  min="10"
                  max="5000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="flex-1"
                />
              </div>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="clay-input w-full mt-2"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-clay-900 mb-2">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="clay-input w-full"
              >
                <option>New York</option>
                <option>Los Angeles</option>
                <option>Chicago</option>
                <option>Boston</option>
                <option>Miami</option>
                <option>Tokyo</option>
                <option>London</option>
                <option>Dubai</option>
              </select>
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-semibold text-clay-900 mb-2">Time of Day</label>
              <select
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: Number(e.target.value) })}
                className="clay-input w-full"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00 - {i < 12 ? 'Morning' : i < 18 ? 'Afternoon' : 'Evening'}
                  </option>
                ))}
              </select>
            </div>

            {/* Device */}
            <div>
              <label className="block text-sm font-semibold text-clay-900 mb-3">Device</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormData({ ...formData, device: 'known' })}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                    formData.device === 'known'
                      ? 'bg-gradient-trust-high text-white shadow-clay-md'
                      : 'bg-clay-100 text-clay-900 hover:bg-clay-200'
                  }`}
                >
                  Known
                </button>
                <button
                  onClick={() => setFormData({ ...formData, device: 'unknown' })}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                    formData.device === 'unknown'
                      ? 'bg-gradient-trust-low text-white shadow-clay-md'
                      : 'bg-clay-100 text-clay-900 hover:bg-clay-200'
                  }`}
                >
                  Unknown
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-clay-900 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="clay-input w-full"
              >
                <option value="shopping">Shopping</option>
                <option value="dining">Dining</option>
                <option value="utilities">Utilities</option>
                <option value="entertainment">Entertainment</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            {/* Simulate Button */}
            <button
              onClick={handleSimulate}
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-trust-medium text-white font-bold rounded-lg hover:shadow-clay-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Simulate Transaction'}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="clay-card p-8">
          <h2 className="text-xl font-bold text-clay-900 mb-6">Analysis Results</h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clay-700 mb-4"></div>
              <p className="text-clay-600 font-semibold">Analyzing transaction...</p>
            </div>
          ) : results ? (
            <div className="space-y-6">
              {/* Decision Badge */}
              {results.decision && (
                <DecisionBadge
                  decision={results.decision}
                  riskLevel={results.riskLevel}
                  fraudScore={results.fraudScore}
                  confidence={results.confidence}
                />
              )}

              {/* System Message */}
              {results.systemMessage && (
                <SystemMessage
                  message={results.systemMessage}
                  decision={results.decision}
                  reasoning={results.reasoning}
                />
              )}

              {/* Legacy Risk Score (for compatibility) */}
              <div className={`p-6 rounded-xl border-2 ${getRiskBg(results.fraudScore)}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Fraud Score Analysis</h3>
                  {getRiskIcon(results.fraudScore)}
                </div>
                <div className="text-4xl font-bold mb-2">
                  {(results.fraudScore * 100).toFixed(0)}%
                </div>
                <p className={`font-semibold ${getRiskColor(results.fraudScore)}`}>
                  {results.summary?.riskLevel || 'Analysis Complete'}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <h3 className="font-bold text-clay-900">Breakdown:</h3>
                <div className="space-y-2 text-sm">
                  {results.explanations && results.explanations.length > 0 ? (
                    results.explanations.slice(0, 5).map((exp, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-clay-50 rounded-lg">
                          <span className="flex-1">{exp.detail || exp.factor || (typeof exp === 'string' ? exp : 'Suspicious activity detected')}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-clay-600">✅ No suspicious patterns detected</p>
                  )}
                </div>
              </div>

              {/* Audit Trail Info */}
              {results.auditLogId && (
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>Audit Log ID:</strong> {results.auditLogId}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    This decision is permanently logged in the audit trail for compliance
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-clay-300 mb-4" />
              <p className="text-clay-600">Enter transaction details and click "Simulate" to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
