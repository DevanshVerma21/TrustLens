import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import TransactionRow from '../components/TransactionRow';
import TransactionDetailModal from '../components/TransactionDetailModal';
import { TransactionsSkeleton } from '../components/LoadingSkeletons';
import useTransactions from '../hooks/useTransactions';

const PAGE_SIZE = 10;

const getStatusTag = (transaction) => {
  if (transaction.isFlagged || transaction.status === 'flagged') return 'flagged';
  if ((transaction.fraudScore || 0) >= 0.6) return 'suspicious';
  return 'normal';
};

export default function Transactions({ user }) {
  const { transactions, stats, loading, error, refetch } = useTransactions({      
    userId: user?.id,
    limit: 200,
    withStats: true,
  });

  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((txn) => {
      const statusTag = getStatusTag(txn);
      if (filters.status !== 'all' && statusTag !== filters.status) return false;
      if (filters.category !== 'all' && txn.category !== filters.category) return false;
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        if (new Date(txn.timestamp) < start) return false;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(txn.timestamp) > end) return false;
      }
      return true;
    });
  }, [transactions, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const pagedTransactions = filteredTransactions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const categoryData = useMemo(() => {
    const source = stats?.categories || {};
    if (Object.keys(source).length > 0) {
      return Object.entries(source).map(([name, count]) => ({
        name,
        count,
      }));
    }

    const counts = {};
    transactions.forEach((txn) => {
      counts[txn.category] = (counts[txn.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [stats, transactions]);

  if (loading) {
    return <TransactionsSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          We could not load transactions.
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
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          Transactions
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Review every transaction with explainable AI insights.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs" style={{ color: 'var(--color-text-light)' }}>
              Status
            </label>
            <select
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)' }}
              value={filters.status}
              onChange={(event) => {
                setFilters({ ...filters, status: event.target.value });
                setPage(1);
              }}
            >
              <option value="all">All</option>
              <option value="normal">Normal</option>
              <option value="suspicious">Suspicious</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--color-text-light)' }}>
              Category
            </label>
            <select
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)' }}
              value={filters.category}
              onChange={(event) => {
                setFilters({ ...filters, category: event.target.value });
                setPage(1);
              }}
            >
              <option value="all">All</option>
              <option value="shopping">Shopping</option>
              <option value="dining">Dining</option>
              <option value="utilities">Utilities</option>
              <option value="entertainment">Entertainment</option>
              <option value="transfer">Transfer</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--color-text-light)' }}>
              Start Date
            </label>
            <input
              type="date"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)' }}
              value={filters.startDate}
              onChange={(event) => {
                setFilters({ ...filters, startDate: event.target.value });
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--color-text-light)' }}>
              End Date
            </label>
            <input
              type="date"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)' }}
              value={filters.endDate}
              onChange={(event) => {
                setFilters({ ...filters, endDate: event.target.value });
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>
            Transactions by Category
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={categoryData} margin={{ top: 10, right: 20, left: 20, bottom: 35 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />  
            <XAxis dataKey="name" tick={{ fontSize: 12 }}>
              <Label value="Category" position="insideBottom" offset={-20} style={{ fill: 'var(--color-text-muted)' }} />     
            </XAxis>
            <YAxis tick={{ fontSize: 12 }}>
              <Label
                value="Transactions"
                angle={-90}
                position="insideLeft"
                offset={-10}
                style={{ textAnchor: 'middle', fill: 'var(--color-text-muted)' }}
              />
            </YAxis>
            <Tooltip
              cursor={{ fill: 'rgba(0, 229, 255, 0.08)' }}
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="count" name="Transactions" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <tbody>
            {pagedTransactions.map((txn) => (
              <TransactionRow
                key={txn._id || `${txn.timestamp}-${txn.amount}`}
                transaction={txn}
                onSelect={() => setSelectedTransaction(txn)}
                onExplain={() => setSelectedTransaction(txn)}
              />
            ))}
            {pagedTransactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                  No transactions match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Page {page} of {totalPages}
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
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-lg border text-sm font-semibold disabled:opacity-50"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
          >
            Next
          </button>
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
