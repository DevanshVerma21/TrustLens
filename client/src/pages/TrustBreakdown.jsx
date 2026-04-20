import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

function WaterfallChart({ factors }) {
  let runningTotal = 100;
  const positions = [];

  factors.forEach((factor) => {
    const startValue = runningTotal;
    runningTotal += factor.value;
    positions.push({
      ...factor,
      startValue,
      endValue: runningTotal,
      height: Math.abs(factor.value),
      isPositive: factor.value >= 0,
    });
  });

  const maxValue = 100;
  const chartHeight = 300;
  const unitHeight = chartHeight / maxValue;

  return (
    <div className="bg-clay-50 p-6 rounded-xl">
      <div className="flex items-end justify-between h-96 gap-4 px-4">
        {/* Start value */}
        <div className="flex flex-col items-center">
          <div
            className="w-12 bg-gradient-trust-high rounded-t-lg"
            style={{ height: `${100 * unitHeight}px` }}
          />
          <p className="text-sm font-semibold text-clay-900 mt-2">Start</p>
          <p className="text-lg font-bold text-clay-900">100</p>
        </div>

        {/* Factor bars */}
        {positions.map((pos, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className="relative w-full" style={{ height: `${300}px` }}>
              {/* Connector line */}
              {i > 0 && (
                <div
                  className="absolute bg-clay-300 opacity-50"
                  style={{
                    bottom: `${(positions[i - 1].endValue / 100) * 300}px`,
                    left: '-50%',
                    width: '50%',
                    height: '2px',
                  }}
                />
              )}

              {/* Bar */}
              <div
                className={`absolute bottom-0 w-full rounded-t-lg transition-all ${
                  pos.isPositive
                    ? 'bg-green-500 border-2 border-green-600'
                    : 'bg-red-500 border-2 border-red-600'
                }`}
                style={{
                  height: `${pos.height * unitHeight}px`,
                  bottom: `${Math.min(pos.startValue, pos.endValue) * unitHeight}px`,
                }}
                title={`${pos.label}: ${pos.value > 0 ? '+' : ''}${pos.value}`}
              />

              {/* Value label */}
              <div
                className="absolute text-center left-0 right-0"
                style={{
                  bottom: `${Math.max(pos.startValue, pos.endValue) * unitHeight + 10}px`,
                }}
              >
                <p className="text-xs font-bold text-clay-900">
                  {pos.value > 0 ? '+' : ''}{pos.value}
                </p>
              </div>
            </div>

            <p className="text-xs font-semibold text-clay-900 mt-2 text-center">{pos.label}</p>
            <p className="text-sm font-bold text-clay-900 mt-1">{pos.endValue}</p>
          </div>
        ))}

        {/* Final value */}
        <div className="flex flex-col items-center">
          <div
            className="w-12 bg-gradient-trust-medium rounded-t-lg"
            style={{ height: `${runningTotal * unitHeight}px` }}
          />
          <p className="text-sm font-semibold text-clay-900 mt-2">Final</p>
          <p className="text-lg font-bold text-clay-900">{Math.round(runningTotal)}</p>
        </div>
      </div>
    </div>
  );
}

function FactorCard({ factor, type }) {
  const isPositive = factor.value >= 0;
  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        isPositive
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-clay-900">{factor.label}</h3>
        {isPositive ? (
          <TrendingUp className="w-5 h-5 text-green-600" />
        ) : (
          <TrendingDown className="w-5 h-5 text-red-600" />
        )}
      </div>
      <p className={`text-lg font-bold mb-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{factor.value} points
      </p>
      <p className="text-sm text-clay-700">{factor.description}</p>
    </div>
  );
}

export default function TrustBreakdown({ trustScore = 78 }) {
  const [timeframe, setTimeframe] = useState('30d');
  const [trendData, setTrendData] = useState([
    { day: '1', score: 72 },
    { day: '5', score: 74 },
    { day: '10', score: 75 },
    { day: '15', score: 76 },
    { day: '20', score: 77 },
    { day: '25', score: 78 },
    { day: '30', score: 78 },
  ]);

  const penalties = [
    { label: 'Fraud Score', value: -8, description: 'Recent transaction flagged as moderate risk' },
    { label: 'Flagged Transactions', value: -10, description: '2 transactions required manual review' },
    { label: 'New Location', value: -3, description: 'Recently transacted from unfamiliar location' },
    { label: 'Account Age', value: -1, description: 'Relatively new account (1+ year)' },
  ];

  const bonuses = [
    { label: 'No Chargebacks', value: +25, description: 'Perfect payment history' },
    { label: 'Device Loyalty', value: +15, description: 'Consistent device usage (85% loyalty)' },
    { label: 'Regular Activity', value: +10, description: 'Predictable spending patterns' },
    { label: 'Identity Verified', value: +20, description: 'Successfully completed all verifications' },
    { label: 'Account Reputation', value: +30, description: 'No fraud incidents in history' },
  ];

  const factors = [...bonuses, ...penalties];
  const totalAdjustment = factors.reduce((sum, f) => sum + f.value, 0);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-clay-900 mb-2">Trust Score Breakdown</h1>
        <p className="text-clay-600">See how factors affect your financial trust score</p>
      </div>

      {/* Current Score */}
      <div className="clay-card p-8 text-center">
        <p className="text-clay-600 mb-2">Your Current Trust Score</p>
        <div className="text-6xl font-bold mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-trust-medium">{trustScore}</span>
          <span className="text-2xl text-clay-600">/100</span>
        </div>
        <p className="text-lg text-green-600 font-semibold">✅ Good Standing</p>
      </div>

      {/* Waterfall Chart */}
      <div className="clay-card p-6">
        <h2 className="text-xl font-bold text-clay-900 mb-6">Score Calculation</h2>
        <p className="text-sm text-clay-600 mb-4">
          Starting from 100 points, each factor adds or subtracts from your score.
        </p>
        <WaterfallChart factors={factors} />
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bonuses */}
        <div>
          <h2 className="text-xl font-bold text-clay-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            What Helped (+100 points)
          </h2>
          <div className="space-y-3">
            {bonuses.map((factor, i) => (
              <FactorCard key={i} factor={factor} type="bonus" />
            ))}
          </div>
        </div>

        {/* Penalties */}
        <div>
          <h2 className="text-xl font-bold text-clay-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-600" />
            What Lowered It (-22 points)
          </h2>
          <div className="space-y-3">
            {penalties.map((factor, i) => (
              <FactorCard key={i} factor={factor} type="penalty" />
            ))}
          </div>
        </div>
      </div>

      {/* Trend */}
      <div className="clay-card p-6">
        <h2 className="text-xl font-bold text-clay-900 mb-4">90-Day Trend</h2>

        {/* Timeframe selector */}
        <div className="flex gap-2 mb-6">
          {['7d', '30d', '90d'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                timeframe === period
                  ? 'bg-gradient-trust-medium text-white shadow-clay-md'
                  : 'bg-clay-100 text-clay-900 hover:bg-clay-200'
              }`}
            >
              {period === '7d' ? '7 Day' : period === '30d' ? '30 Day' : '90 Day'}
            </button>
          ))}
        </div>

        {/* Trend chart */}
        <div className="bg-clay-50 p-6 rounded-lg">
          <div className="flex items-end justify-between h-48 gap-2">
            {trendData.map((data, i) => {
              const maxScore = 100;
              const percentage = (data.score / maxScore) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-trust-medium rounded-t-lg transition-all hover:shadow-clay-md cursor-pointer"
                    style={{ height: `${percentage * 1.92}px` }}
                    title={`Day ${data.day}: ${data.score}`}
                  />
                  <p className="text-xs text-clay-600 mt-2">Day {data.day}</p>
                  <p className="text-xs font-bold text-clay-900">{data.score}</p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-sm text-green-600 font-semibold mt-4 flex items-center gap-2">
          ✅ Trend: Improving (+6 points / month)
        </p>
      </div>

      {/* Recommendations */}
      <div className="clay-card p-6 bg-blue-50 border-2 border-blue-200">
        <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-6 h-6" />
          How to Improve Your Score
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="font-bold text-blue-600">1.</span>
            <span className="text-blue-900">
              <strong>Maintain consistent patterns:</strong> Regular spending helps establish trust
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-bold text-blue-600">2.</span>
            <span className="text-blue-900">
              <strong>Use known devices:</strong> Stick to familiar devices and locations
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-bold text-blue-600">3.</span>
            <span className="text-blue-900">
              <strong>Avoid unusual patterns:</strong> Large amounts or unusual times trigger reviews
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-bold text-blue-600">4.</span>
            <span className="text-blue-900">
              <strong>Keep account secure:</strong> No chargebacks or disputes improves trust
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-bold text-blue-600">5.</span>
            <span className="text-blue-900">
              <strong>Verify new locations:</strong> Pre-notify before traveling to new regions
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
