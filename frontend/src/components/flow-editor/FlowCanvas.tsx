import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlowProvider,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TransactionInputNode from './nodes/TransactionInputNode';
import RuleNode from './nodes/RuleNode';
import ConditionGroupNode from './nodes/ConditionGroupNode';
import DecisionOutputNode from './nodes/DecisionOutputNode';

import type { FlowNode, FlowEdge } from '../../types/flow';

interface FlowCanvasProps {
  initialNodes: FlowNode[];
  initialEdges: FlowEdge[];
  onNodeClick?: (nodeId: string) => void;
  onNodesChange?: (changes: any[]) => void;
  onEdgesChange?: (changes: any[]) => void;
}

const nodeTypes = {
  transactionInput: TransactionInputNode,
  rule: RuleNode,
  conditionGroup: ConditionGroupNode,
  decisionOutput: DecisionOutputNode,
} as NodeTypes;

function FlowCanvasContent({
  initialNodes,
  initialEdges,
  onNodeClick,
  onNodesChange,
  onEdgesChange,
}: FlowCanvasProps) {
  // Style edges with markers and colors
  const styledEdges = useMemo(
    () =>
      (initialEdges || []).map((edge) => ({
        ...edge,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        style: {
          strokeWidth: edge.isHighlighted ? 3 : 2,
          stroke: edge.isHighlighted ? '#10b981' : '#94a3b8',
        },
      })),
    [initialEdges]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: FlowNode) => {
      if (node.type === 'rule' && onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
      <ReactFlow
        nodes={initialNodes || []}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        // Important for stability in some environments
        translateExtent={[[-1000, -1000], [2000, 2000]]}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'transactionInput':
                return '#3b82f6';
              case 'rule':
                return '#a855f7';
              case 'conditionGroup':
                return '#f97316';
              case 'decisionOutput':
                return '#10b981';
              default:
                return '#94a3b8';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}

export default function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasContent {...props} />
    </ReactFlowProvider>
  );
}
