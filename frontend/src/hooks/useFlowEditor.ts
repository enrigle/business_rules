import { useCallback } from 'react';
import { create } from 'zustand';
import dagre from 'dagre';
import type { Rule, EvaluationTrace, Decision } from '../types';
import type {
  FlowNode,
  FlowEdge,
  FlowEditorState,
  RuleNodeData,
  ConditionGroupNodeData,
  DecisionOutputNodeData,
  TransactionInputNodeData,
} from '../types/flow';

// Constants for layout
const NODE_WIDTH = 280;
const NODE_HEIGHT = 120;
const RANK_SPACING = 150;
const NODE_SPACING = 100;

// Zustand store
interface FlowEditorStore extends FlowEditorState {
  setNodes: (nodes: FlowNode[] | ((prev: FlowNode[]) => FlowNode[])) => void;
  setEdges: (edges: FlowEdge[] | ((prev: FlowEdge[]) => FlowEdge[])) => void;
  setSelectedNodeId: (id: string | null) => void;
  setRules: (rules: Rule[]) => void;
  setEvaluationTrace: (trace: EvaluationTrace | null) => void;
  setDirty: (dirty: boolean) => void;
  reset: () => void;
}

const useFlowEditorStore = create<FlowEditorStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  rules: [],
  evaluationTrace: null,
  isDirty: false,
  setNodes: (nodes) => set((state) => ({ nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes })),
  setEdges: (edges) => set((state) => ({ edges: typeof edges === 'function' ? edges(state.edges) : edges })),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setRules: (rules) => set({ rules, isDirty: true }),
  setEvaluationTrace: (trace) => set({ evaluationTrace: trace }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  reset: () =>
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      rules: [],
      evaluationTrace: null,
      isDirty: false,
    }),
}));

// Hook
export function useFlowEditor() {
  const store = useFlowEditorStore();

  // Convert rules to ReactFlow nodes and edges
  const rulesToFlow = useCallback(
    (rules: Rule[]): { nodes: FlowNode[]; edges: FlowEdge[] } => {
      const nodes: FlowNode[] = [];
      const edges: FlowEdge[] = [];

      // 1. Create transaction input node (start)
      const inputNode: FlowNode = {
        id: 'transaction-input',
        type: 'transactionInput',
        position: { x: 0, y: 0 }, // Will be set by layout
        data: {
          fields: [
            'transaction_amount',
            'merchant_category',
            'transaction_velocity_24h',
            'is_new_device',
            'country_mismatch',
          ],
        } as TransactionInputNodeData,
      };
      nodes.push(inputNode);

      // 2. Create rule nodes
      rules.forEach((rule, index) => {
        const isDefault = rule.id === 'DEFAULT';

        // Create condition group node if rule has conditions
        if (rule.conditions && rule.conditions.length > 0) {
          const conditionGroupNode: FlowNode = {
            id: `condition-${rule.id}`,
            type: 'conditionGroup',
            position: { x: 0, y: 0 },
            data: {
              ruleId: rule.id,
              logic: rule.logic,
              conditions: rule.conditions,
            } as ConditionGroupNodeData,
          };
          nodes.push(conditionGroupNode);

          // Edge from previous rule/input to condition group
          const sourceId = index === 0 ? 'transaction-input' : `rule-${rules[index - 1].id}`;
          edges.push({
            id: `e-${sourceId}-condition-${rule.id}`,
            source: sourceId,
            target: `condition-${rule.id}`,
            label: 'evaluate',
            type: 'smoothstep',
          });

          // Edge from condition group to rule node
          edges.push({
            id: `e-condition-${rule.id}-rule-${rule.id}`,
            source: `condition-${rule.id}`,
            target: `rule-${rule.id}`,
            label: 'match',
            type: 'smoothstep',
          });
        }

        // Create rule node
        const ruleNode: FlowNode = {
          id: `rule-${rule.id}`,
          type: 'rule',
          position: { x: 0, y: 0 },
          data: {
            rule,
            isDefault,
          } as RuleNodeData,
        };
        nodes.push(ruleNode);

        // Edge from input/previous rule to this rule (if no conditions)
        if (!rule.conditions || rule.conditions.length === 0) {
          const sourceId = index === 0 ? 'transaction-input' : `rule-${rules[index - 1].id}`;
          edges.push({
            id: `e-${sourceId}-rule-${rule.id}`,
            source: sourceId,
            target: `rule-${rule.id}`,
            label: isDefault ? 'default' : 'no match',
            type: 'smoothstep',
          });
        }

        // Edge from rule to decision output
        const decisionNodeId = `decision-${rule.outcome.decision}`;
        edges.push({
          id: `e-rule-${rule.id}-${decisionNodeId}`,
          source: `rule-${rule.id}`,
          target: decisionNodeId,
          label: `${rule.outcome.risk_score}`,
          type: 'smoothstep',
        });

        // Edge to next rule (if not DEFAULT and has conditions)
        if (!isDefault && index < rules.length - 1) {
          const nextRuleId = rules[index + 1].id;
          const targetId =
            rules[index + 1].conditions && rules[index + 1].conditions.length > 0
              ? `condition-${nextRuleId}`
              : `rule-${nextRuleId}`;

          edges.push({
            id: `e-condition-${rule.id}-${targetId}-nomatch`,
            source: `condition-${rule.id}`,
            target: targetId,
            label: 'no match',
            type: 'smoothstep',
            animated: true,
          });
        }
      });

      // 3. Create decision output nodes
      const decisions: Decision[] = ['ALLOW', 'REVIEW', 'BLOCK'];
      decisions.forEach((decision) => {
        const decisionNode: FlowNode = {
          id: `decision-${decision}`,
          type: 'decisionOutput',
          position: { x: 0, y: 0 },
          data: {
            decision,
          } as DecisionOutputNodeData,
        };
        nodes.push(decisionNode);
      });

      // 4. Apply dagre layout
      const g = new dagre.graphlib.Graph();
      g.setGraph({ rankdir: 'TB', ranksep: RANK_SPACING, nodesep: NODE_SPACING });
      g.setDefaultEdgeLabel(() => ({}));

      nodes.forEach((node) => {
        g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
      });

      edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
      });

      dagre.layout(g);

      // Apply calculated positions
      const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - NODE_WIDTH / 2,
            y: nodeWithPosition.y - NODE_HEIGHT / 2,
          },
        };
      });

      return { nodes: layoutedNodes, edges };
    },
    []
  );

  // Highlight path based on evaluation trace
  const highlightPath = useCallback(
    (trace: EvaluationTrace) => {
      const { nodes, edges } = store;

      // Find matched rule from trace
      const matchedRuleId = trace.evaluated_rules.find((re) => re.matched)?.rule_id;
      if (!matchedRuleId) return;

      // Highlight nodes
      const highlightedNodes = nodes.map((node) => {
        if (node.type === 'rule' && (node.data as RuleNodeData).rule.id === matchedRuleId) {
          return { ...node, data: { ...node.data, isHighlighted: true } };
        }
        if (
          node.type === 'conditionGroup' &&
          (node.data as ConditionGroupNodeData).ruleId === matchedRuleId
        ) {
          return { ...node, data: { ...node.data, isHighlighted: true } };
        }
        // Highlight decision output based on matched rule's decision
        const matchedRule = trace.evaluated_rules.find((re) => re.matched);
        if (
          node.type === 'decisionOutput' &&
          matchedRule &&
          (node.data as DecisionOutputNodeData).decision ===
            store.rules.find((r) => r.id === matchedRule.rule_id)?.outcome.decision
        ) {
          return { ...node, data: { ...node.data, isHighlighted: true } };
        }
        return node;
      });

      // Highlight edges in path
      const highlightedEdges = edges.map((edge) => {
        // Edge from input to first rule/condition
        if (edge.source === 'transaction-input') {
          return { ...edge, animated: true, isHighlighted: true };
        }
        // Edge to/from matched rule
        if (
          edge.source === `rule-${matchedRuleId}` ||
          edge.target === `rule-${matchedRuleId}` ||
          edge.source === `condition-${matchedRuleId}` ||
          edge.target === `condition-${matchedRuleId}`
        ) {
          return { ...edge, animated: true, isHighlighted: true };
        }
        return edge;
      });

      store.setNodes(highlightedNodes);
      store.setEdges(highlightedEdges);
      store.setEvaluationTrace(trace);
    },
    [store]
  );

  // Clear all highlights
  const clearHighlights = useCallback(() => {
    const { nodes, edges } = store;

    const clearedNodes = nodes.map((node) => ({
      ...node,
      data: { ...node.data, isHighlighted: false },
    }));

    const clearedEdges = edges.map((edge) => ({
      ...edge,
      animated: false,
      isHighlighted: false,
    }));

    store.setNodes(clearedNodes);
    store.setEdges(clearedEdges);
    store.setEvaluationTrace(null);
  }, [store]);

  // Load rules and generate flow
  const loadRules = useCallback(
    (rules: Rule[]) => {
      const { nodes, edges } = rulesToFlow(rules);
      store.setRules(rules);
      store.setNodes(nodes);
      store.setEdges(edges);
      store.setDirty(false);
    },
    [rulesToFlow, store]
  );

  // Update rule positions based on drag (for reordering)
  const updateRuleOrder = useCallback(
    (nodes: FlowNode[]): Rule[] => {
      // Extract rule nodes and sort by Y position
      const ruleNodes = nodes
        .filter((n) => n.type === 'rule')
        .sort((a, b) => a.position.y - b.position.y);

      // Get rules in new order
      const orderedRules = ruleNodes.map((node) => (node.data as RuleNodeData).rule);

      // Ensure DEFAULT is last
      const nonDefaultRules = orderedRules.filter((r) => r.id !== 'DEFAULT');
      const defaultRule = orderedRules.find((r) => r.id === 'DEFAULT');

      return defaultRule ? [...nonDefaultRules, defaultRule] : nonDefaultRules;
    },
    []
  );

  return {
    ...store,
    rulesToFlow,
    highlightPath,
    clearHighlights,
    loadRules,
    updateRuleOrder,
  };
}
