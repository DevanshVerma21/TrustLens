import React, { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import TrustScoreBadge from '../components/TrustScoreBadge';
import RiskFactorCard from '../components/RiskFactorCard';
import TransactionRow from '../components/TransactionRow';
import TransactionDetailModal from '../components/TransactionDetailModal';
import { DashboardSkeleton } from '../components/LoadingSkeletons';
import useTrust from '../hooks/useTrust';
import useTransactions from '../hooks/useTransactions';

export default function Dashboard({ user }) {
  const { score, history, factors, loading: trustLoading, error: trustError, refetch: refetchTrust } =
    useTrust();
  const {
    transactions,
    stats,
    loading: txnLoading,
    error: txnError,
    refetch: refetchTransactions,
  } = useTransactions({ userId: user?.id, page: 1, limit: 5, withStats: true });

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const { chartData, xAxisTicks } = useMemo(() => {
    if (!history || history.length === 0) {
      return { chartData: [], xAxisTicks: [] };
    }

    // The backend provides a 30-day array. We find the FIRST day that actually has a score.
    const firstValidIndex = history.findIndex(h => h.score !== null);

    if (firstValidIndex === -1) {
      // No recorded transactions at all
      return { chartData: [], xAxisTicks: [] };
    }

    // Slice from the earliest recorded transaction up to today
    const relevantHistory = history.slice(firstValidIndex);

    const data = relevantHistory.map(h => {
      const d = new Date(h.date);
      return {
        fullDate: d,
        date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        score: h.score,
      };
    });

    // Maintain a 3-day gap for X-Axis labels, starting from the oldest date in relevant history
    const ticks = [];
    for (let i = 0; i < data.length; i += 3) {
      ticks.push(data[i].date);
    }
    // Make sure the last date (today) is shown if it's not already in there, 
    // but the instruction says "maintain the 3 days gap as it did". 
    // Just pulling every 3rd item from the left ensures the left-most date is always listed.

    return { chartData: data, xAxisTicks: ticks };
  }, [history]);

  const statsSummary = {
    total: stats?.totalTransactions ?? stats?.total ?? 0,
    flagged: stats?.fraudTransactions ?? stats?.flaggedCount ?? 0,
    blocked:
      stats?.blockedCount ??
      transactions.filter((txn) => txn.status === 'declined').length,
  };

  if (trustLoading || txnLoading) {
    return <DashboardSkeleton />;
  }

  if (trustError || txnError) {
    return (
      <div
        className="rounded-lg border bg-white p-6"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          We could not load your dashboard.
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {trustError || txnError}
        </p>
        <button
          onClick={() => {
            refetchTrust();
            refetchTransactions();
          }}
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
          Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Your real-time trust health and recent activity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div
            className="rounded-lg border bg-white p-5"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Current Trust Score
            </h3>
            <div className="flex justify-center">
              <TrustScoreBadge score={score?.score ?? 0} size="lg" />
            </div>
          </div>

          <div
            className="rounded-lg border bg-white p-5"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              30-Day Score Trend
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" ticks={xAxisTicks} interval={0} tick={{ fontSize: 12 }}>
                  <Label value="Date" position="insideBottom" offset={-20} style={{ fill: 'var(--color-text-muted)' }} />
                </XAxis>
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }}>
                  <Label
                    value="Trust Score"
                    angle={-90}
                    position="insideLeft"
                    offset={-10}
                    style={{ textAnchor: 'middle', fill: 'var(--color-text-muted)' }}
                  />
                </YAxis>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Trust Score"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={chartData.length === 1 ? { r: 4, fill: 'var(--color-primary)' } : false}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
              Top Risk Factors
            </h3>
            {factors.slice(0, 3).map((factor) => (
              <RiskFactorCard
                key={factor.name}
                factor={{
                  name: factor.name,
                  description: factor.description,
                  status: factor.impact === 'negative' ? 'warning' : 'normal',
                  weight: factor.weight,
                }}
              />
            ))}
            {factors.length === 0 && (
              <div
                className="rounded-lg border bg-white p-5"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p style={{ color: 'var(--color-text-muted)' }}>
                  No significant risk factors detected.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Transactions', value: statsSummary.total },
              { label: 'Flagged', value: statsSummary.flagged },
              { label: 'Blocked', value: statsSummary.blocked },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border bg-white p-5"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                  {stat.label}
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div
            className="rounded-lg border bg-white p-5"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                Recent Transactions
              </h3>
              <a
                href="/transactions"
                className="text-sm font-semibold"
                style={{ color: 'var(--color-primary)' }}
              >
                View All
              </a>
            </div>
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {transactions.map((txn) => (
                      <TransactionRow
                        key={txn._id || `${txn.timestamp}-${txn.amount}`}
                        transaction={txn}
                        onSelect={() => setSelectedTransaction(txn)}
                        actionLabel="Explain"
                        onAction={() => setSelectedTransaction(txn)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)' }}>No recent transactions.</p>
            )}
          </div>
        </div>
      </div>

      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
