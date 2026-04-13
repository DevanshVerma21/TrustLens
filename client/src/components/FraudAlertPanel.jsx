import React, { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, ShieldCheck, TrendingUp } from 'lucide-react';

const FraudAlertPanel = ({ alert = null, onDismiss }) => {
  const [animKey, setAnimKey] = useState(0);

  // Retrigger animation each time alert changes
  useEffect(() => {
    if (alert) setAnimKey((k) => k + 1);
  }, [alert]);

  if (!alert) {
    return (
      <div id="fraud-alert-panel" className="clay-card">
        <div className="flex items-center gap-4">
          <div className="relative">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-lg">All Clear</p>
            <p className="text-sm text-gray-500">AI engine monitoring — no threats detected</p>
          </div>
        </div>
      </div>
    );
  }

  const isHigh = alert.riskLevel && (
    alert.riskLevel.toLowerCase().includes('high') ||
    alert.riskLevel.toLowerCase().includes('critical')
  );
  const isCritical = alert.fraudScore > 0.8;
  const scorePercent = (alert.fraudScore * 100).toFixed(1);

  const bgClass = isCritical
    ? 'fraud-panel-critical'
    : isHigh
    ? 'fraud-panel-high'
    : 'fraud-panel-medium';

  const barColor = isCritical
    ? 'linear-gradient(90deg, #f87171, #dc2626)'
    : isHigh
    ? 'linear-gradient(90deg, #fb923c, #ea580c)'
    : 'linear-gradient(90deg, #fbbf24, #d97706)';

  return (
    <div
      id="fraud-alert-panel"
      key={animKey}
      className={`clay-card fraud-panel alert-slide-in ${bgClass}`}
    >
      {/* Shimmer overlay */}
      <div className="fraud-panel-shimmer" />

      {/* Header row */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          {isCritical ? (
            <div className="relative">
              <AlertTriangle className="w-9 h-9 text-red-500" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            </div>
          ) : (
            <AlertCircle className="w-9 h-9 text-amber-500" />
          )}
          <div>
            <p className="font-bold text-lg text-gray-900 leading-tight">{alert.riskLevel}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-block w-2 h-2 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-xs text-gray-600 font-mono uppercase tracking-wider">
                {isCritical ? 'Immediate Review Required' : 'Under Review'}
              </span>
            </div>
          </div>
        </div>
        {onDismiss && (
          <button
            id="fraud-panel-dismiss"
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-700 text-xl font-bold transition-colors leading-none mt-0.5 ml-2"
            title="Dismiss alert"
          >
            ✕
          </button>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-700 mt-3 relative z-10 leading-relaxed">
        {alert.summary}
      </p>

      {/* Fraud score */}
      <div className="mt-4 relative z-10">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-mono flex items-center gap-1">
            <TrendingUp size={11} /> Fraud Probability
          </span>
          <span className={`text-sm font-bold font-mono ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
            {scorePercent}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full fraud-score-bar"
            style={{ width: `${scorePercent}%`, background: barColor }}
          />
        </div>
      </div>

      {/* Reasons */}
      {alert.explanations && alert.explanations.length > 0 && (
        <div className="mt-4 relative z-10">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono mb-2">
            Risk Indicators
          </p>
          <div className="space-y-1.5">
            {alert.explanations.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className={`flex-shrink-0 mt-0.5 ${isCritical ? 'text-red-500' : 'text-amber-500'}`}>▸</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudAlertPanel;
