import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import evaluationAPI from '../../api/evaluation';
import transactionsAPI from '../../api/transactions';
import type { Transaction, EvaluationTrace } from '../../types';

interface EvaluationOverlayProps {
  onEvaluate: (trace: EvaluationTrace) => void;
  onClear: () => void;
}

export default function EvaluationOverlay({ onEvaluate, onClear }: EvaluationOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [transaction, setTransaction] = useState<Partial<Transaction>>({
    transaction_amount: 5000,
    transaction_velocity_24h: 2,
    merchant_category: 'crypto',
    is_new_device: true,
    country_mismatch: false,
  });

  const evaluateMutation = useMutation({
    mutationFn: (tx: Transaction) => evaluationAPI.evaluateTransaction(tx, true),
    onSuccess: (data) => {
      if (data.trace) {
        onEvaluate(data.trace);
      }
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => transactionsAPI.generateTransactions(1),
    onSuccess: (data) => {
      if (data.transactions[0]) {
        setTransaction(data.transactions[0]);
      }
    },
  });

  const handleEvaluate = () => {
    const tx: Transaction = {
      transaction_id: `test-${Date.now()}`,
      transaction_amount: transaction.transaction_amount || 0,
      transaction_velocity_24h: transaction.transaction_velocity_24h || 0,
      merchant_category: transaction.merchant_category || 'retail',
      is_new_device: transaction.is_new_device || false,
      country_mismatch: transaction.country_mismatch || false,
    };
    evaluateMutation.mutate(tx);
  };

  const handleClear = () => {
    onClear();
    evaluateMutation.reset();
  };

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 font-medium"
        >
          🧪 Test Transaction
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-96 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Test Transaction</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={transaction.transaction_amount}
                onChange={(e) =>
                  setTransaction({ ...transaction, transaction_amount: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Velocity (24h)
              </label>
              <input
                type="number"
                value={transaction.transaction_velocity_24h}
                onChange={(e) =>
                  setTransaction({ ...transaction, transaction_velocity_24h: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Merchant Category
              </label>
              <select
                value={transaction.merchant_category}
                onChange={(e) =>
                  setTransaction({ ...transaction, merchant_category: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="retail">Retail</option>
                <option value="travel">Travel</option>
                <option value="gambling">Gambling</option>
                <option value="crypto">Crypto</option>
                <option value="electronics">Electronics</option>
              </select>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={transaction.is_new_device}
                  onChange={(e) =>
                    setTransaction({ ...transaction, is_new_device: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-gray-700">New Device</span>
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={transaction.country_mismatch}
                  onChange={(e) =>
                    setTransaction({ ...transaction, country_mismatch: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-gray-700">Country Mismatch</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium disabled:opacity-50"
            >
              {generateMutation.isPending ? 'Generating...' : '🎲 Random'}
            </button>
            <button
              onClick={handleEvaluate}
              disabled={evaluateMutation.isPending}
              className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
            >
              {evaluateMutation.isPending ? 'Evaluating...' : '▶ Evaluate'}
            </button>
          </div>

          {evaluateMutation.isSuccess && evaluateMutation.data && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
              <div className="font-medium text-green-800 mb-1">Result</div>
              <div className="text-xs text-gray-700 space-y-1">
                <div>
                  <strong>Decision:</strong>{' '}
                  <span className={`font-bold ${
                    evaluateMutation.data.result.decision === 'ALLOW'
                      ? 'text-green-700'
                      : evaluateMutation.data.result.decision === 'BLOCK'
                        ? 'text-red-700'
                        : 'text-yellow-700'
                  }`}>
                    {evaluateMutation.data.result.decision}
                  </span>
                </div>
                <div>
                  <strong>Risk Score:</strong> {evaluateMutation.data.result.risk_score}
                </div>
                <div>
                  <strong>Matched Rule:</strong> {evaluateMutation.data.result.matched_rule_name}
                </div>
              </div>
              <button
                onClick={handleClear}
                className="mt-2 text-xs text-green-700 hover:text-green-800 font-medium"
              >
                Clear Highlights
              </button>
            </div>
          )}

          {evaluateMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              Failed to evaluate transaction
            </div>
          )}
        </div>
      )}
    </div>
  );
}
