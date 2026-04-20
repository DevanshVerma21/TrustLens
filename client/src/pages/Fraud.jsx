import React, { useState } from 'react';
import { demoAPI } from '../utils/api';

export default function FraudSimulation() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const scenarios = [
    {
      type: 'card_cloning',
      name: 'Card Cloning',
      description: 'Multiple small transactions in quick succession from different cities',
      icon: '💳',
      difficulty: 'Easy',
      what: '5 transactions in 3 minutes from Mumbai, Delhi, Bangalore, Chennai, Kolkata',
    },
    {
      type: 'account_takeover',
      name: 'Account Takeover',
      description: 'Login from new country + immediate large transfer',
      icon: '🔓',
      difficulty: 'Easy',
      what: 'Large transfers from Singapore and Thailand with new device',
    },
    {
      type: 'merchant_fraud',
      name: 'Merchant Fraud',
      description: 'Transaction to risky merchant category',
      icon: '🏪',
      difficulty: 'Medium',
      what: 'Transaction to a high-risk crypto or gambling merchant',
    },
    {
      type: 'velocity_attack',
      name: 'Velocity Attack',
      description: '10+ transactions in 5 minutes (automated)',
      icon: '⚡',
      difficulty: 'Very Easy',
      what: '12 rapid-fire transactions simulating bot activity',
    },
  ];

  const runScenario = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await demoAPI.simulateTransaction(selectedScenario.type);

      // Simulate trust score drop animation
      setTimeout(() => {
        setResult({
          scenario: selectedScenario.name,
          success: true,
          trustScoreBefore: 85,
          trustScoreAfter: 85 - (selectedScenario.type === 'velocity_attack' ? 40 : 25),
          transactionsGenerated: selectedScenario.type === 'velocity_attack' ? 12 : 5,
          alertsTriggered: selectedScenario.type === 'account_takeover' ? 3 : 2,
          expectedDecision: 'BLOCK',
          explanation:
            selectedScenario.type === 'card_cloning'
              ? 'Multiple cards used in different locations in short time span'
              : selectedScenario.type === 'account_takeover'
                ? 'Large transaction from unrecognized country detected'
                : selectedScenario.type === 'velocity_attack'
                  ? 'Abnormal transaction frequency detected'
                  : 'Unusual merchant category detected',
        });
      }, 2000);
    } catch (error) {
      console.error('Simulation error:', error);
      setResult({ success: false, error: 'Simulation failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Fraud Simulation
        </h1>
        <p className="text-slate-600" style={{ color: 'var(--color-text-muted)' }}>
          Test how TrustLens detects various fraud patterns
        </p>
      </div>

      {/* Scenario Cards */}
      {!result ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((scenario) => (
            <div
              key={scenario.type}
              onClick={() => setSelectedScenario(scenario)}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                selectedScenario?.type === scenario.type
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
              style={{
                borderColor:
                  selectedScenario?.type === scenario.type
                    ? 'var(--color-primary)'
                    : 'var(--color-border)',
                backgroundColor:
                  selectedScenario?.type === scenario.type
                    ? '#E0E7FF'
                    : 'var(--color-surface)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{scenario.icon}</div>
                <span
                  className="px-2 py-1 rounded text-xs font-semibold"
                  style={{
                    backgroundColor:
                      scenario.difficulty === 'Easy'
                        ? '#10B98166'
                        : scenario.difficulty === 'Very Easy'
                          ? '#16A34A33'
                          : '#D9770633',
                    color:
                      scenario.difficulty === 'Easy'
                        ? '#16A34A'
                        : scenario.difficulty === 'Very Easy'
                          ? '#059669'
                          : '#D97706',
                  }}
                >
                  {scenario.difficulty}
                </span>
              </div>

              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text)' }}>
                {scenario.name}
              </h3>
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                {scenario.description}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                What happens: {scenario.what}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Run Button */}
      {selectedScenario && !result && (
        <div className="text-center">
          <button
            onClick={runScenario}
            disabled={loading}
            className="px-8 py-3 rounded-lg font-semibold text-white transition disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {loading ? '⏳ Running Simulation...' : '▶️ Run Simulation'}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div
          className="p-6 rounded-lg border bg-white space-y-6"
          style={{
            borderColor: result.success ? 'var(--color-success)' : 'var(--color-danger)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              {result.success ? '✓ Simulation Complete' : '✗ Simulation Failed'}
            </h2>

            {result.success && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    className="p-4 rounded-lg bg-slate-50"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                  >
                    <p className="text-xs text-slate-600" style={{ color: 'var(--color-text-light)' }}>
                      Scenario
                    </p>
                    <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      {result.scenario}
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-lg bg-slate-50"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                  >
                    <p className="text-xs text-slate-600" style={{ color: 'var(--color-text-light)' }}>
                      Trust Score
                    </p>
                    <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      {result.trustScoreBefore} → {result.trustScoreAfter}
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-lg bg-slate-50"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                  >
                    <p className="text-xs text-slate-600" style={{ color: 'var(--color-text-light)' }}>
                      Transactions
                    </p>
                    <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      {result.transactionsGenerated} generated
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-lg bg-slate-50"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                  >
                    <p className="text-xs text-slate-600" style={{ color: 'var(--color-text-light)' }}>
                      Decision
                    </p>
                    <p className="font-semibold text-red-600">{result.expectedDecision}</p>
                  </div>
                </div>

                <div
                  className="p-4 rounded-lg border"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-bg)',
                  }}
                >
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    How TrustLens Detected It
                  </h4>
                  <p style={{ color: 'var(--color-text-muted)' }}>{result.explanation}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setResult(null);
                      setSelectedScenario(null);
                    }}
                    className="px-4 py-2 rounded-lg border font-semibold transition hover:bg-slate-50"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  >
                    Try Another
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg font-semibold text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    View Alerts
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
