import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { DecisionOutputNodeData } from '../../../types/flow';

const DECISION_STYLES = {
  ALLOW: {
    border: 'border-green-600',
    bg: 'bg-green-100',
    icon: '✓',
    iconBg: 'bg-green-600',
    text: 'text-green-800',
  },
  REVIEW: {
    border: 'border-yellow-600',
    bg: 'bg-yellow-100',
    icon: '⚠',
    iconBg: 'bg-yellow-600',
    text: 'text-yellow-800',
  },
  BLOCK: {
    border: 'border-red-600',
    bg: 'bg-red-100',
    icon: '✕',
    iconBg: 'bg-red-600',
    text: 'text-red-800',
  },
};

function DecisionOutputNode({ data }: NodeProps) {
  const nodeData = data as DecisionOutputNodeData;
  const { decision, isHighlighted } = nodeData;
  const style = DECISION_STYLES[decision as keyof typeof DECISION_STYLES];

  const borderClass = isHighlighted ? 'border-4 border-green-500 shadow-xl' : `border-2 ${style.border}`;

  return (
    <div className={`px-6 py-4 shadow-lg rounded-xl ${borderClass} ${style.bg} min-w-[180px]`}>
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 !${style.iconBg}`}
      />

      <div className="flex flex-col items-center gap-2">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center text-white text-xl font-bold`}>
          {style.icon}
        </div>

        {/* Decision label */}
        <div className={`font-bold text-lg ${style.text}`}>{decision}</div>

        {/* Description */}
        <div className="text-xs text-gray-600 text-center">
          {decision === 'ALLOW' && 'Transaction approved'}
          {decision === 'REVIEW' && 'Manual review required'}
          {decision === 'BLOCK' && 'Transaction declined'}
        </div>

        {isHighlighted && (
          <div className="mt-1 px-2 py-1 bg-white rounded text-xs font-semibold text-green-700 animate-pulse">
            Matched
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(DecisionOutputNode);
