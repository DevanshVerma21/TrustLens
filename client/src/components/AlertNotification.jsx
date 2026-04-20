import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, X, TrendingDown, TrendingUp } from 'lucide-react';

/**
 * AlertNotification Component
 * Displays fraud alerts with animations and visual hierarchy
 */
export default function AlertNotification({ alert, onDismiss, autoClose = true }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (!autoClose) return;

    const timer = setTimeout(() => {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, 300);
    }, 6000);

    return () => clearTimeout(timer);
  }, [autoClose, onDismiss]);

  if (!isVisible) return null;

  const getSeverityStyles = (severity) => {
    const styles = {
      high: {
        bg: 'bg-red-50',
        border: 'border-l-4 border-red-500',
        icon: <AlertCircle className="w-6 h-6 text-red-600" />,
        badge: 'bg-red-100 text-red-700',
      },
      medium: {
        bg: 'bg-amber-50',
        border: 'border-l-4 border-amber-500',
        icon: <AlertCircle className="w-6 h-6 text-amber-600" />,
        badge: 'bg-amber-100 text-amber-700',
      },
      low: {
        bg: 'bg-green-50',
        border: 'border-l-4 border-green-500',
        icon: <CheckCircle className="w-6 h-6 text-green-600" />,
        badge: 'bg-green-100 text-green-700',
      },
    };
    return styles[severity] || styles.medium;
  };

  const styles = getSeverityStyles(alert.severity);

  return (
    <div
      className={`${styles.bg} ${styles.border} p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
        isAnimatingOut ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">{styles.icon}</div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-clay-900">{alert.title}</h3>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${styles.badge}`}>
              {alert.severity.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-clay-700">{alert.description}</p>
          {alert.details && (
            <ul className="mt-2 text-xs text-clay-600 space-y-1">
              {alert.details.map((detail, i) => (
                <li key={i}>• {detail}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-clay-500 mt-2">
            {new Date(alert.timestamp).toLocaleTimeString()}
          </p>
        </div>

        <button
          onClick={() => {
            setIsAnimatingOut(true);
            setTimeout(() => {
              setIsVisible(false);
              onDismiss?.();
            }, 300);
          }}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
        >
          <X className="w-5 h-5 text-clay-700" />
        </button>
      </div>
    </div>
  );
}
