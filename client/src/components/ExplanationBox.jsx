import React from 'react';
import { Info, Lightbulb } from 'lucide-react';

const ExplanationBox = ({ transaction = null, loading = false }) => {
  if (loading) {
    return (
      <div className="clay-card">
        <div className="flex items-center gap-4">
          <div className="animate-spin">
            <Lightbulb className="w-6 h-6 text-clay-500" />
          </div>
          <p className="text-gray-600">Analyzing transaction...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="clay-card">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-gray-400" />
          <p className="text-gray-500 text-sm">Select a transaction to see detailed explanation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clay-card">
      <h3 className="text-base font-bold text-gray-100 mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        Why This Decision?
      </h3>

      {/* Transaction Summary */}
      <div className="bg-white/5 rounded-xl p-4 mb-5 border border-white/8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase font-mono">Amount</p>
            <p className="font-bold text-gray-200 font-mono">₹{transaction.amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-mono">Location</p>
            <p className="font-bold text-gray-200 font-mono">{transaction.location}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-mono">Category</p>
            <p className="font-bold text-gray-800 capitalize">{transaction.category}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-mono">Status</p>
            <p className="font-bold text-gray-200 font-mono">
              {transaction.isFlagged ? '🚨 Flagged' : '✅ Approved'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Findings */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-300 mb-3 text-sm">🔍 Key Findings</h4>
        <div className="space-y-2">
          {transaction.explanations?.length > 0 ? (
            transaction.explanations.map((explanation, idx) => (
              <div key={idx} className="flex gap-3 text-sm">
                <span className="text-lg flex-shrink-0">
                  {explanation.includes('High') ? '📈' : explanation.includes('Location') ? '📍' : explanation.includes('Time') ? '⏰' : explanation.includes('Device') ? '📱' : '⚡'}
                </span>
                <p className="text-gray-400 text-sm">{explanation}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">✅ No suspicious patterns detected</p>
          )}
        </div>
      </div>

      {/* AI Confidence */}
      <div className="border-t border-white/5 pt-4">
        <p className="text-xs text-gray-500 uppercase font-semibold font-mono mb-3">AI Confidence Levels</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Amount Analysis</span>
            <span className="font-mono text-xs text-gray-500">
              {(transaction.fraudScore * 100 * 0.3).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Fraud Risk Score</span>
            <span className="font-mono font-bold text-gray-200">
              {(transaction.fraudScore * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
        <p className="text-xs text-blue-400 font-semibold">💡 Recommendation</p>
        <p className="text-xs text-blue-300/70 mt-1">
          {transaction.isFlagged
            ? 'Please verify this transaction with your bank. You may be asked to confirm your identity.'
            : 'Transaction verified and approved. Continue with your banking activities.'}
        </p>
      </div>
    </div>
  );
};

export default ExplanationBox;
