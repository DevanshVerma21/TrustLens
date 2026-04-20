import React from 'react';
import { CheckCircle, AlertCircle, XCircle, AlertTriangle, Pause } from 'lucide-react';

/**
 * SystemMessage Component
 * Displays system message with appropriate styling
 */
export default function SystemMessage({ message, decision, reasoning }) {
  const MESSAGE_CONFIG = {
    APPROVE: {
      emoji: '✅',
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-l-4 border-green-500',
      textColor: 'text-green-900',
    },
    CHALLENGE: {
      emoji: '🟡',
      icon: AlertCircle,
      bgColor: 'bg-amber-50',
      borderColor: 'border-l-4 border-amber-500',
      textColor: 'text-amber-900',
    },
    DECLINE: {
      emoji: '🚩',
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-l-4 border-red-500',
      textColor: 'text-red-900',
    },
    ESCALATE: {
      emoji: '⚠️',
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      borderColor: 'border-l-4 border-red-500',
      textColor: 'text-red-900',
    },
    HOLD: {
      emoji: '⏸️',
      icon: Pause,
      bgColor: 'bg-amber-50',
      borderColor: 'border-l-4 border-amber-500',
      textColor: 'text-amber-900',
    },
  };

  const config = MESSAGE_CONFIG[decision] || MESSAGE_CONFIG.APPROVE;
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} p-4 rounded-lg`}>
      {/* Message header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{config.emoji}</span>
        <div className="flex-1">
          <p className={`text-lg font-bold ${config.textColor}`}>{message}</p>
        </div>
      </div>

      {/* Reasoning details */}
      {reasoning && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <p className={`text-sm font-semibold ${config.textColor} mb-2`}>Decision Reasoning:</p>
          <ul className={`space-y-1 text-sm`}>
            {reasoning.decisionFactors && reasoning.decisionFactors.length > 0 ? (
              reasoning.decisionFactors.map((factor, index) => (
                <li key={index} className={config.textColor}>
                  • {factor}
                </li>
              ))
            ) : (
              <li className={config.textColor}>• Standard transaction processing</li>
            )}
            {reasoning.fraudReason && (
              <li className={config.textColor}>
                • Fraud: {reasoning.fraudReason}
              </li>
            )}
            {reasoning.trustReason && (
              <li className={config.textColor}>
                • Trust: {reasoning.trustReason}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
