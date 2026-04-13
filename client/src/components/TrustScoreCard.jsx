import React, { useState, useEffect } from 'react';

const TrustScoreCard = ({ trustScore = 85, riskLevel = 'low' }) => {
  const [scoreTheta, setScoreTheta] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScoreTheta((prev) => (prev + 2) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Color mapping
  const colors = {
    high: '#10b981',
    medium: '#f59e0b',
    low: '#ef4444',
  };

  const getRiskColor = () => {
    if (trustScore >= 75) return colors.high;
    if (trustScore >= 50) return colors.medium;
    return colors.low;
  };

  const getRiskLabel = () => {
    if (trustScore >= 75) return '🟢 Low Risk';
    if (trustScore >= 50) return '🟡 Medium Risk';
    return '🔴 High Risk';
  };

  return (
    <div className="clay-card">
      <div className="flex flex-col items-center gap-6">
        <h2 className="text-xl font-bold text-gray-100 tracking-tight">Trust Score</h2>

        {/* Circular Score Display */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Background circle */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="95"
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="8"
            />
            {/* Animated progress ring */}
            <circle
              cx="100"
              cy="100"
              r="95"
              fill="none"
              stroke={getRiskColor()}
              strokeWidth="8"
              strokeDasharray={`${(trustScore / 100) * 597} 597`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>

          {/* Score text */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-5xl font-bold" style={{ color: getRiskColor() }}>
              {trustScore}
            </div>
            <div className="text-sm text-gray-500 mt-2 font-mono">/100</div>
          </div>
        </div>

        {/* Risk indicator */}
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-200 mb-1.5">{getRiskLabel()}</p>
          <p className="text-xs text-gray-500 leading-relaxed font-mono">
            {trustScore >= 75
              ? 'Your account shows normal behavior patterns'
              : trustScore >= 50
              ? 'Some anomalies detected, monitor your account'
              : 'High risk activity detected - review recent transactions'}
          </p>
        </div>

        {/* Status badge */}
        <div className="mt-4 px-6 py-2 rounded-full bg-white/5 border border-white/10">
          <span className="text-xs font-medium text-gray-400 font-mono tracking-wider">STATUS: ACTIVE</span>
        </div>
      </div>
    </div>
  );
};

export default TrustScoreCard;
