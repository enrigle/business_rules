import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { RuleNodeData } from '../../../types/flow';

function RuleNode({ data, selected }: NodeProps) {
  const nodeData = data as RuleNodeData;
  const { rule, isDefault, isHighlighted } = nodeData;
  const borderColor = isHighlighted
    ? 'border-green-500'
    : selected
      ? 'border-indigo-600'
      : isDefault
        ? 'border-gray-400'
        : 'border-purple-500';

  const bgColor = isHighlighted
    ? 'bg-green-50'
    : isDefault
      ? 'bg-gray-50'
      : 'bg-purple-50';

  const badgeColors: Record<string, string> = {
    ALLOW: 'bg-green-100 text-green-800',
    REVIEW: 'bg-yellow-100 text-yellow-800',
    BLOCK: 'bg-red-100 text-red-800',
  };
  const badgeColor = badgeColors[rule.outcome.decision];

  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 ${borderColor} ${bgColor} min-w-[280px]`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500"
      />

      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-mono text-xs text-gray-500">{rule.id}</div>
            <div className="font-semibold text-sm text-gray-800 line-clamp-2">
              {rule.name}
            </div>
          </div>
          {isDefault && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
              DEFAULT
            </span>
          )}
        </div>

        {/* Conditions summary */}
        {rule.conditions && rule.conditions.length > 0 && (
          <div className="text-xs text-gray-600">
            <div className="font-medium mb-1">
              {rule.conditions.length} condition{rule.conditions.length > 1 ? 's' : ''} ({rule.logic})
            </div>
            <div className="space-y-0.5 max-h-16 overflow-y-auto">
              {rule.conditions.slice(0, 3).map((cond: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1 text-xs">
                  <code className="text-purple-700">{cond.field}</code>
                  <span className="text-gray-500">{cond.operator}</span>
                  <code className="text-purple-700 truncate max-w-[80px]">
                    {typeof cond.value === 'boolean'
                      ? String(cond.value)
                      : cond.value}
                  </code>
                </div>
              ))}
              {rule.conditions.length > 3 && (
                <div className="text-gray-400 italic">
                  +{rule.conditions.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Outcome */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-bold rounded ${badgeColor}`}>
              {rule.outcome.decision}
            </span>
            <span className="text-xs font-mono text-gray-600">
              Risk: {rule.outcome.risk_score}
            </span>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-500"
      />
    </div>
  );
}

export default memo(RuleNode);
