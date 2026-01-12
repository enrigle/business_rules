import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ConditionGroupNodeData } from '../../../types/flow';

function ConditionGroupNode({ data }: NodeProps) {
  const nodeData = data as ConditionGroupNodeData;
  const { logic, conditions, isHighlighted } = nodeData;
  const isAnd = logic === 'AND';

  const borderColor = isHighlighted ? 'border-green-500' : isAnd ? 'border-orange-500' : 'border-pink-500';
  const bgColor = isHighlighted ? 'bg-green-50' : isAnd ? 'bg-orange-50' : 'bg-pink-50';
  const iconBg = isHighlighted ? 'bg-green-500' : isAnd ? 'bg-orange-500' : 'bg-pink-500';

  return (
    <div
      className={`px-4 py-3 shadow-md rounded-lg border-2 ${borderColor} ${bgColor} min-w-[240px]`}
      style={{
        borderRadius: isAnd ? '12px' : '8px',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 !${iconBg}`}
      />

      <div className="space-y-2">
        {/* Logic type badge */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${iconBg}`} />
          <span className="font-bold text-xs text-gray-700">
            {logic} Logic
          </span>
        </div>

        {/* Conditions */}
        <div className="text-xs text-gray-600 space-y-1">
          {conditions.map((cond: any, idx: number) => (
            <div key={idx} className="flex items-center gap-1 py-1 px-2 bg-white rounded">
              <code className="text-xs font-mono text-gray-800">{cond.field}</code>
              <span className="text-gray-500 text-xs">{cond.operator}</span>
              <code className="text-xs font-mono text-gray-800 truncate max-w-[100px]">
                {typeof cond.value === 'boolean' ? String(cond.value) : cond.value}
              </code>
            </div>
          ))}
        </div>

        {/* Logic description */}
        <div className="text-xs text-gray-500 italic pt-1 border-t border-gray-200">
          {isAnd ? 'All must be true' : 'Any can be true'}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 !${iconBg}`}
        id="match"
      />
      <Handle
        type="source"
        position={Position.Right}
        className={`w-3 h-3 !${iconBg}`}
        id="no-match"
      />
    </div>
  );
}

export default memo(ConditionGroupNode);
