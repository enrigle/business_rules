import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { TransactionInputNodeData } from '../../../types/flow';

function TransactionInputNode({ data }: NodeProps) {
  const nodeData = data as TransactionInputNodeData;
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg border-2 border-blue-500 bg-blue-50">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <div className="font-bold text-sm text-gray-700">Transaction Input</div>
      </div>
      <div className="text-xs text-gray-600 space-y-1">
        {nodeData.fields.map((field: string) => (
          <div key={field} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <code className="text-xs">{field}</code>
          </div>
        ))}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500"
      />
    </div>
  );
}

export default memo(TransactionInputNode);
