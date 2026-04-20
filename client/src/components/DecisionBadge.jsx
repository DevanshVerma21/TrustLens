import React from 'react';
import { AlertCircle, CheckCircle, XCircle, AlertTriangle, Pause } from 'lucide-react';

/**
 * DecisionBadge Component
 * Displays the decision with color coding and icon
 */
export default function DecisionBadge({ decision, riskLevel, fraudScore, confidence }) {
  const DECISION_CONFIG = {
    APPROVE: {
      emoji: '✅',
      label: 'Approved',
      color: 'bg-green-50',
      textColor: 'text-green-900',
      borderColor: 'border-green-200',
      icon: CheckCircle,
      bgGradient: 'from-green-50 to-green-100',
    },
    CHALLENGE: {
      emoji: '🟡',
      label: 'Review Required',
      color: 'bg-amber-50',
      textColor: 'text-amber-900',
      borderColor: 'border-amber-200',
      icon: AlertCircle,
      bgGradient: 'from-amber-50 to-amber-100',
    },
    DECLINE: {
      emoji: '🚩',
      label: 'Declined',
      color: 'bg-red-50',
      textColor: 'text-red-900',
      borderColor: 'border-red-200',
      icon: XCircle,
      bgGradient: 'from-red-50 to-red-100',
    },
    ESCALATE: {
      emoji: '⚠️',
      label: 'Escalated',
      color: 'bg-red-50',
      textColor: 'text-red-900',
      borderColor: 'border-red-200',
      icon: AlertTriangle,
      bgGradient: 'from-red-50 to-red-100',
    },
    HOLD: {
      emoji: '⏸️',
      label: 'On Hold',
      color: 'bg-amber-50',
      textColor: 'text-amber-900',
      borderColor: 'border-amber-200',
      icon: Pause,
      bgGradient: 'from-amber-50 to-amber-100',
    },
  };

  const RISK_LEVEL_CONFIG = {
    LOW: {
      emoji: '🟢',
      label: 'Low Risk',
      color: '#10b981',
    },
    MEDIUM: {
      emoji: '🟡',
      label: 'Medium Risk',
      color: '#f59e0b',
    },
    HIGH: {
      emoji: '🔴',
      label: 'High Risk',
      color: '#ef4444',
    },
  };

  const config = DECISION_CONFIG[decision] || DECISION_CONFIG.APPROVE;
  const Icon = config.icon;
  const riskConfig = RISK_LEVEL_CONFIG[riskLevel] || RISK_LEVEL_CONFIG.MEDIUM;

  return (
    <div className={`p-6 rounded-2xl border-2 ${config.borderColor} ${config.color} space-y-4`}>
      {/* Decision header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{config.emoji}</span>
          <div>
            <h3 className={`text-2xl font-bold ${config.textColor}`}>{config.label}</h3>
            <p className="text-sm text-gray-600">Transaction Decision</p>
          </div>
        </div>
        <Icon className={`w-8 h-8`} style={{ color: riskConfig.color }} />
      </div>

      {/* Decision metrics */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t-2" style={{ borderColor: riskConfig.color + '30' }}>
        <div>
          <p className="text-xs text-gray-600 mb-1">Risk Level</p>
          <div className="flex items-center gap-2">
            <span className="text-lg">{riskConfig.emoji}</span>
            <p className="font-bold">{riskConfig.label}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Fraud Score</p>
          <p className="text-2xl font-bold">{(fraudScore * 100).toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Confidence</p>
          <p className="text-2xl font-bold">{(confidence * 100).toFixed(0)}%</p>
        </div>
      </div>
    </div>
  );
}
