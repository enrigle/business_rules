import type { Node, Edge } from '@xyflow/react';
import type { Rule, Condition, Decision, EvaluationTrace } from './index';

// Node types
export type NodeType = 'transactionInput' | 'rule' | 'conditionGroup' | 'decisionOutput';

// Node data interfaces with index signatures for React Flow compatibility
export interface TransactionInputNodeData extends Record<string, unknown> {
  fields: string[];
}

export interface RuleNodeData extends Record<string, unknown> {
  rule: Rule;
  isDefault: boolean;
  isHighlighted?: boolean; // For evaluation visualization
}

export interface ConditionGroupNodeData extends Record<string, unknown> {
  ruleId: string;
  logic: 'AND' | 'OR';
  conditions: Condition[];
  isHighlighted?: boolean;
}

export interface DecisionOutputNodeData extends Record<string, unknown> {
  decision: Decision;
  count?: number; // Number of rules leading to this decision
  isHighlighted?: boolean;
}

// Union type for all node data
export type FlowNodeData =
  | TransactionInputNodeData
  | RuleNodeData
  | ConditionGroupNodeData
  | DecisionOutputNodeData;

// Typed nodes
export type FlowNode = Node<FlowNodeData>;

// Edge types
export interface FlowEdge extends Edge {
  animated?: boolean;
  isHighlighted?: boolean;
}

// Flow state
export interface FlowEditorState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;
  rules: Rule[];
  evaluationTrace: EvaluationTrace | null;
  isDirty: boolean; // Unsaved changes
}

// Layout options
export interface LayoutOptions {
  direction: 'TB' | 'LR'; // Top-to-bottom or left-to-right
  nodeSpacing: number;
  rankSpacing: number;
}

// Convert functions (implemented in useFlowEditor)
export interface FlowConverters {
  rulesToFlow: (rules: Rule[]) => { nodes: FlowNode[]; edges: FlowEdge[] };
  flowToRules: (nodes: FlowNode[]) => Rule[];
  highlightPath: (trace: EvaluationTrace) => void;
  clearHighlights: () => void;
}
