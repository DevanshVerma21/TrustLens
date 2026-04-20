import React, { useState } from 'react';
import { AlertsSkeleton } from '../components/LoadingSkeletons';
import useAlerts from '../hooks/useAlerts';

const severityOrder = ['critical', 'high', 'medium', 'low'];

const severityMeta = {
  critical: { color: '#DC2626', label: 'Critical' },
  high: { color: '#EA580C', label: 'High' },
  medium: { color: '#D97706', label: 'Medium' },
  low: { color: '#2563EB', label: 'Low' },
};

const typeIcon = {
  fraud_flag: '!',
  trust_drop: 'v',
  unusual_activity: '!',
  login: 'i',
};

export default function Alerts() {
  const [page, setPage] = useState(1);
  const {
    alerts,
    unreadCount,
    loading,
    error,
    pagination,
    markAsRead,
    markAllAsRead,
    clearRead,
    deleteAlert,
    refetch,
  } = useAlerts(page);

  const groupedAlerts = severityOrder.reduce((acc, severity) => {
    acc[severity] = alerts.filter((alert) => (alert.severity || 'low') === severity);
    return acc;
  }, {});

  if (loading) {
    return <AlertsSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          We could not load alerts.
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {error}
        </p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 rounded-lg border font-semibold"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
            Alerts
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread alerts.`
              : 'All clear! No unread alerts.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-lg border font-semibold"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            >
              Mark All Read
            </button>
          )}
          <button
            onClick={clearRead}
            className="px-4 py-2 rounded-lg border font-semibold"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            Clear All Read
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div
          className="rounded-lg border bg-white p-10 text-center"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div
            className="mx-auto mb-4 h-16 w-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-surface-secondary)', color: 'var(--color-primary)' }}
          >
            OK
          </div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
            All clear! No alerts.
          </h2>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Your account is in good standing.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {severityOrder.map((severity) => {
            const entries = groupedAlerts[severity] || [];
            if (entries.length === 0) return null;

            return (
              <div key={severity} className="space-y-3">
                <h2 className="text-sm font-semibold uppercase" style={{ color: severityMeta[severity].color }}>
                  {severityMeta[severity].label} Priority ({entries.length})
                </h2>
                {entries.map((alert) => (
                  <div
                    key={alert._id}
                    className="rounded-lg border bg-white p-5"
                    style={{
                      borderColor: 'var(--color-border)',
                      borderLeft: `4px solid ${severityMeta[severity].color}`,
                      opacity: alert.isRead ? 0.7 : 1,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                            style={{ backgroundColor: 'var(--color-surface-secondary)', color: severityMeta[severity].color }}
                          >
                            {typeIcon[alert.type] || '!'}
                          </span>
                          <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                            {alert.type?.replace(/_/g, ' ') || 'Alert'}
                          </h3>
                          {!alert.isRead && (
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                          )}
                        </div>
                        <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                          {alert.message}
                        </p>
                        <p className="text-xs mt-3" style={{ color: 'var(--color-text-light)' }}>
                          {new Date(alert.createdAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!alert.isRead && (
                          <button
                            onClick={() => markAsRead(alert._id)}
                            className="px-3 py-1 rounded-lg border text-xs font-semibold"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => deleteAlert(alert._id)}
                          className="px-3 py-1 rounded-lg border text-xs font-semibold"
                          style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Page {page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 rounded-lg border text-sm font-semibold disabled:opacity-50"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(pagination.pages, page + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-2 rounded-lg border text-sm font-semibold disabled:opacity-50"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
