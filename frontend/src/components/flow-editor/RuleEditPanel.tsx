import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rulesAPI } from '../../api';
import type { Rule, Condition, Decision } from '../../types';

interface RuleEditPanelProps {
  rule: Rule | null;
  onClose: () => void;
  isNew?: boolean;
}

const OPERATORS = ['>', '<', '>=', '<=', '==', '!=', 'in', 'not_in'] as const;
const DECISIONS: Decision[] = ['ALLOW', 'REVIEW', 'BLOCK'];
const MERCHANT_CATEGORIES = ['retail', 'travel', 'gambling', 'crypto', 'electronics'];
const FIELD_OPTIONS = [
  { value: 'transaction_amount', type: 'number' },
  { value: 'transaction_velocity_24h', type: 'number' },
  { value: 'merchant_category', type: 'string' },
  { value: 'is_new_device', type: 'boolean' },
  { value: 'country_mismatch', type: 'boolean' },
  { value: 'account_age_days', type: 'number' },
];

export default function RuleEditPanel({ rule, onClose, isNew = false }: RuleEditPanelProps) {
  const queryClient = useQueryClient();
  const [editedRule, setEditedRule] = useState<Rule | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (rule) {
      setEditedRule(JSON.parse(JSON.stringify(rule)));
    } else if (isNew) {
      setEditedRule({
        id: 'NEW_RULE',
        name: 'New Rule',
        conditions: [],
        logic: 'AND',
        outcome: {
          risk_score: 50,
          decision: 'REVIEW',
          reason: '',
        },
      });
    }
  }, [rule, isNew]);

  const updateMutation = useMutation({
    mutationFn: (updatedRule: Rule) => rulesAPI.updateRule(updatedRule.id, updatedRule, 'v1'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      onClose();
    },
    onError: (error: any) => {
      setErrors([error.response?.data?.detail || 'Failed to update rule']);
    },
  });

  const createMutation = useMutation({
    mutationFn: (newRule: Rule) => rulesAPI.createRule(newRule, 'v1'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      onClose();
    },
    onError: (error: any) => {
      setErrors([error.response?.data?.detail || 'Failed to create rule']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => rulesAPI.deleteRule(ruleId, 'v1'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      onClose();
    },
    onError: (error: any) => {
      setErrors([error.response?.data?.detail || 'Failed to delete rule']);
    },
  });

  if (!editedRule) return null;

  const isDefault = editedRule.id === 'DEFAULT';

  const handleSave = () => {
    setErrors([]);
    if (isNew) {
      createMutation.mutate(editedRule);
    } else {
      updateMutation.mutate(editedRule);
    }
  };

  const handleDelete = () => {
    if (confirm(`Delete rule "${editedRule.name}"?`)) {
      deleteMutation.mutate(editedRule.id);
    }
  };

  const addCondition = () => {
    setEditedRule({
      ...editedRule,
      conditions: [
        ...editedRule.conditions,
        { field: 'transaction_amount', operator: '>', value: 0 },
      ],
    });
  };

  const updateCondition = (index: number, field: keyof Condition, value: any) => {
    const newConditions = [...editedRule.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setEditedRule({ ...editedRule, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    setEditedRule({
      ...editedRule,
      conditions: editedRule.conditions.filter((_, i) => i !== index),
    });
  };

  const getValueInput = (condition: Condition, index: number) => {
    const fieldInfo = FIELD_OPTIONS.find((f) => f.value === condition.field);

    if (fieldInfo?.type === 'boolean') {
      return (
        <select
          value={String(condition.value)}
          onChange={(e) => updateCondition(index, 'value', e.target.value === 'true')}
          className="px-2 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }

    if (condition.field === 'merchant_category' && ['in', 'not_in', '=='].includes(condition.operator)) {
      return (
        <select
          value={String(condition.value)}
          onChange={(e) => updateCondition(index, 'value', e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded"
        >
          {MERCHANT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      );
    }

    if (fieldInfo?.type === 'number') {
      return (
        <input
          type="number"
          value={condition.value as number}
          onChange={(e) => updateCondition(index, 'value', parseFloat(e.target.value))}
          className="px-2 py-1 text-sm border border-gray-300 rounded w-24"
        />
      );
    }

    return (
      <input
        type="text"
        value={String(condition.value)}
        onChange={(e) => updateCondition(index, 'value', e.target.value)}
        className="px-2 py-1 text-sm border border-gray-300 rounded"
      />
    );
  };

  return (
    <div className="w-96 bg-white border-l border-gray-300 p-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">
          {isNew ? 'New Rule' : isDefault ? 'Default Rule (Read-Only)' : 'Edit Rule'}
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 p-2 bg-red-50 border border-red-300 rounded text-sm text-red-700">
          {errors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {/* Rule name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
          <input
            type="text"
            value={editedRule.name}
            onChange={(e) => setEditedRule({ ...editedRule, name: e.target.value })}
            disabled={isDefault}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
          />
        </div>

        {/* Conditions */}
        {!isDefault && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Conditions</label>
              <button
                onClick={addCondition}
                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Add
              </button>
            </div>

            <div className="space-y-2">
              {editedRule.conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <select
                    value={cond.field}
                    onChange={(e) => updateCondition(idx, 'field', e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded"
                  >
                    {FIELD_OPTIONS.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.value}
                      </option>
                    ))}
                  </select>

                  <select
                    value={cond.operator}
                    onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>

                  {getValueInput(cond, idx)}

                  <button
                    onClick={() => removeCondition(idx)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Logic */}
            {editedRule.conditions.length > 1 && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Logic</label>
                <select
                  value={editedRule.logic}
                  onChange={(e) => setEditedRule({ ...editedRule, logic: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="AND">AND (all must match)</option>
                  <option value="OR">OR (any must match)</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Outcome */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Outcome</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Decision</label>
              <div className="flex gap-2">
                {DECISIONS.map((dec) => (
                  <button
                    key={dec}
                    onClick={() =>
                      setEditedRule({
                        ...editedRule,
                        outcome: { ...editedRule.outcome, decision: dec },
                      })
                    }
                    disabled={isDefault}
                    className={`px-3 py-1 text-sm rounded ${
                      editedRule.outcome.decision === dec
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:opacity-50`}
                  >
                    {dec}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Risk Score: {editedRule.outcome.risk_score}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={editedRule.outcome.risk_score}
                onChange={(e) =>
                  setEditedRule({
                    ...editedRule,
                    outcome: { ...editedRule.outcome, risk_score: parseInt(e.target.value) },
                  })
                }
                disabled={isDefault}
                className="w-full disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Reason</label>
              <textarea
                value={editedRule.outcome.reason}
                onChange={(e) =>
                  setEditedRule({
                    ...editedRule,
                    outcome: { ...editedRule.outcome, reason: e.target.value },
                  })
                }
                disabled={isDefault}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={isDefault || updateMutation.isPending || createMutation.isPending}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {isNew ? 'Create' : 'Save'}
          </button>
          {!isNew && !isDefault && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-red-500 text-white rounded font-medium hover:bg-red-600 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
