import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pie, PieChart, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { PrivacySkeleton } from '../components/LoadingSkeletons';
import useTrust from '../hooks/useTrust';
import { authAPI, transactionAPI } from '../utils/api';
import { Download, Trash2, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

const COLORS = ['#1A56DB', '#10B981', '#D97706', '#DC2626', '#64748B'];

export default function Privacy({ user }) {
  const { factors, score, loading, error, refetch } = useTrust();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState('idle'); // idle | loading | done | error
  const [deleteError, setDeleteError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const [toggles, setToggles] = useState({
    location: true,
    history: true,
    device: true,
    patterns: true,
  });

  const dataTypes = [
    {
      id: 'location',
      name: 'Location',
      why: 'Detect unusual geographic patterns and travel anomalies.',
      retention: '90 days',
    },
    {
      id: 'history',
      name: 'Transaction History',
      why: 'Build your baseline spending behavior and anomaly thresholds.',
      retention: '12 months',
    },
    {
      id: 'device',
      name: 'Device Info',
      why: 'Confirm known devices and flag risky logins.',
      retention: '30 days',
    },
    {
      id: 'patterns',
      name: 'Login Patterns',
      why: 'Identify unusual access times and account takeover attempts.',
      retention: '6 months',
    },
  ];

  const chartData = useMemo(() => {
    if (!factors || factors.length === 0) {
      return [
        { name: 'Amount', value: 30 },
        { name: 'Location', value: 20 },
        { name: 'Device', value: 15 },
        { name: 'Behavior', value: 35 },
      ];
    }
    return factors.map((factor) => ({
      name: factor.name,
      value: Math.abs(Number(factor.weight || 0)) || 1,
    }));
  }, [factors]);

  // --- Export: pulls transactions + trust data and packages as JSON ---
  const handleExport = async () => {
    setExportLoading(true);
    setExportDone(false);

    try {
      let transactions = [];
      try {
        const txnRes = await transactionAPI.getTransactions({
          userId: user?.id || user?._id,
          page: 1,
          limit: 500,
        });
        transactions = txnRes?.data?.transactions || txnRes?.transactions || [];
      } catch {
        // non-fatal — export with whatever we have
      }

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        account: {
          id: user?.id || user?._id,
          name: user?.name,
          email: user?.email,
          trustScore: score?.score ?? null,
          riskLevel: user?.riskLevel ?? null,
          accountStatus: user?.accountStatus ?? null,
        },
        privacySettings: toggles,
        trustFactors: factors || [],
        transactions,
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trustlens-export-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportLoading(false);
    }
  };

  // --- Delete: calls API, clears storage, redirects to login ---
  const handleDeleteAccount = async () => {
    setDeleteStep('loading');
    setDeleteError('');
    try {
      await authAPI.deleteAccount();
      localStorage.removeItem('trustlens_token');
      localStorage.removeItem('trustlens_blocked_cards');
      setDeleteStep('done');
      // Brief pause to show success message, then hard-redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 1800);
    } catch (err) {
      setDeleteError(
        err?.response?.data?.error || err?.message || 'Failed to delete account. Please try again.'
      );
      setDeleteStep('error');
    }
  };

  if (loading) return <PrivacySkeleton />;

  if (error) {
    return (
      <div className="rounded-lg border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          We could not load privacy data.
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
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
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Privacy Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Control what data TrustLens uses to protect you.
        </p>
      </div>

      {/* Trust Score Data Usage Chart */}
      <div className="rounded-lg border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          Trust Score Data Usage
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Data toggles */}
      <div className="space-y-4">
        <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>
          What Data We Use
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataTypes.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border bg-white p-5"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                    {item.name}
                  </h3>
                  <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                    {item.why}
                  </p>
                  <p className="text-xs mt-3" style={{ color: 'var(--color-text-light)' }}>
                    Retention: {item.retention}
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={toggles[item.id]}
                    onChange={() =>
                      setToggles((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                    }
                  />
                  <div
                    className="w-10 h-6 rounded-full transition-colors"
                    style={{
                      backgroundColor: toggles[item.id]
                        ? 'var(--color-success)'
                        : 'var(--color-border)',
                    }}
                  >
                    <div
                      className="h-4 w-4 bg-white rounded-full transition-transform"
                      style={{
                        transform: toggles[item.id]
                          ? 'translate(18px, 4px)'
                          : 'translate(4px, 4px)',
                      }}
                    />
                  </div>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Data */}
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="flex items-center justify-center gap-2 rounded-lg border px-4 py-3 font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          {exportLoading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : exportDone ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {exportLoading ? 'Exporting…' : exportDone ? 'Downloaded!' : 'Export Data as JSON'}
        </button>

        {/* Delete Account */}
        <button
          onClick={() => { setDeleteStep('idle'); setDeleteError(''); setShowDeleteConfirm(true); }}
          className="flex items-center justify-center gap-2 rounded-lg border px-4 py-3 font-semibold transition-all"
          style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      {/* Delete Account Info Card */}
      <div
        className="rounded-lg border p-5"
        style={{ borderColor: 'var(--color-danger)', backgroundColor: 'rgba(220,38,38,0.06)' }}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-danger)' }} />
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--color-danger)' }}>
              Delete Account
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Permanently removes your account, all transactions, and trust score data. This action
              cannot be undone. We recommend exporting your data first.
            </p>
            <button
              onClick={() => { setDeleteStep('idle'); setDeleteError(''); setShowDeleteConfirm(true); }}
              className="mt-3 px-4 py-2 rounded-lg border font-semibold text-sm"
              style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
            >
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { if (deleteStep !== 'loading') setShowDeleteConfirm(false); }}
        >
          <div
            className="rounded-xl border p-6 max-w-md w-full mx-4 shadow-xl"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {deleteStep === 'done' ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                  Account Deleted
                </h3>
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  Your account has been permanently deleted. Redirecting…
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(220,38,38,0.12)' }}
                  >
                    <Trash2 className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />
                  </div>
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                    Delete Account
                  </h3>
                </div>

                <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  This will permanently delete:
                </p>
                <ul className="text-sm space-y-1 mb-5 pl-4 list-disc" style={{ color: 'var(--color-text-muted)' }}>
                  <li>Your account and profile</li>
                  <li>All transaction history</li>
                  <li>Your trust score and factors</li>
                  <li>All associated data</li>
                </ul>
                <p className="text-sm font-semibold mb-5" style={{ color: 'var(--color-danger)' }}>
                  ⚠ This action cannot be undone.
                </p>

                {deleteStep === 'error' && (
                  <div
                    className="mb-4 px-4 py-3 rounded-lg text-sm"
                    style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: 'var(--color-danger)' }}
                  >
                    {deleteError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteStep === 'loading'}
                    className="flex-1 px-4 py-2 rounded-lg border font-semibold text-sm disabled:opacity-50"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteStep === 'loading'}
                    className="flex-1 px-4 py-2 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-danger)' }}
                  >
                    {deleteStep === 'loading' ? (
                      <><Loader className="w-4 h-4 animate-spin" /> Deleting…</>
                    ) : (
                      <><Trash2 className="w-4 h-4" /> Yes, Delete</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
