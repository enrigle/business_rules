import { useCallback } from 'react';
import { create } from 'zustand';
import dagre from 'dagre';
import { applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange } from '@xyflow/react';
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
  loadRules: (rules: Rule[], nodes: FlowNode[], edges: FlowEdge[]) => void;
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
  setRules: (rules) => set({ rules }),
  setEvaluationTrace: (trace) => set({ evaluationTrace: trace }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  loadRules: (rules, nodes, edges) => set({ rules, nodes, edges, isDirty: false }),
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
  const nodes = useFlowEditorStore((state) => state.nodes);
  const edges = useFlowEditorStore((state) => state.edges);
  const rules = useFlowEditorStore((state) => state.rules);
  const isDirty = useFlowEditorStore((state) => state.isDirty);
  const evaluationTrace = useFlowEditorStore((state) => state.evaluationTrace);
  const selectedNodeId = useFlowEditorStore((state) => state.selectedNodeId);

  const setNodes = useFlowEditorStore((state) => state.setNodes);
  const setEdges = useFlowEditorStore((state) => state.setEdges);
  const setRules = useFlowEditorStore((state) => state.setRules);
  const setDirty = useFlowEditorStore((state) => state.setDirty);
  const setEvaluationTrace = useFlowEditorStore((state) => state.setEvaluationTrace);
  const setSelectedNodeId = useFlowEditorStore((state) => state.setSelectedNodeId);

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
      try {
        // console.log('Applying dagre layout. dagre:', !!dagre, 'graphlib:', !!dagre?.graphlib);
        if (dagre && dagre.graphlib) {
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
            // Fallback if node not found in graph (should not happen)
            if (!nodeWithPosition) return node;

            return {
              ...node,
              position: {
                x: nodeWithPosition.x - NODE_WIDTH / 2,
                y: nodeWithPosition.y - NODE_HEIGHT / 2,
              },
            };
          });

          return { nodes: layoutedNodes, edges };
        } else {
          console.warn('Dagre not loaded or missing graphlib', dagre);
          return { nodes, edges };
        }
      } catch (err) {
        console.error('Error calculating flow layout:', err);
        return { nodes, edges };
      }
    },
    []
  );

  // Highlight path based on evaluation trace
  const highlightPath = useCallback(
    (trace: EvaluationTrace) => {
      const matchedRuleId = trace.evaluated_rules.find((re) => re.matched)?.rule_id;

      if (!matchedRuleId) {
        setEvaluationTrace(trace);
        return;
      }

      setNodes((prevNodes) => prevNodes.map((node) => {
        if (node.type === 'rule' && (node.data as RuleNodeData).rule.id === matchedRuleId) {
          return { ...node, data: { ...node.data, isHighlighted: true } };
        }

        if (
          node.type === 'conditionGroup' &&
          (node.data as ConditionGroupNodeData).ruleId === matchedRuleId
        ) {
          return { ...node, data: { ...node.data, isHighlighted: true } };
        }

        return node;
      }));

      setEdges((prevEdges) => prevEdges.map(edge => {
        if (edge.source === 'transaction-input') return { ...edge, animated: true, isHighlighted: true };
        if (
          edge.source === `rule-${matchedRuleId}` ||
          edge.target === `rule-${matchedRuleId}` ||
          edge.source === `condition-${matchedRuleId}` ||
          edge.target === `condition-${matchedRuleId}`
        ) {
          return { ...edge, animated: true, isHighlighted: true };
        }
        return edge;
      }));

      setEvaluationTrace(trace);
    },
    [setNodes, setEdges, setEvaluationTrace]
  );

  // Clear all highlights
  const clearHighlights = useCallback(() => {
    setNodes((nodes) => nodes.map((node) => ({
      ...node,
      data: { ...node.data, isHighlighted: false },
    })));

    setEdges((edges) => edges.map((edge) => ({
      ...edge,
      animated: false,
      isHighlighted: false,
    })));

    setEvaluationTrace(null);
  }, [setNodes, setEdges, setEvaluationTrace]);

  const storeLoadRules = useFlowEditorStore((state) => state.loadRules);

  // Load rules and generate flow
  const loadRules = useCallback(
    (rules: Rule[]) => {
      const { nodes, edges } = rulesToFlow(rules);
      storeLoadRules(rules, nodes, edges);
    },
    [rulesToFlow, storeLoadRules]
  );

  // Handle React Flow changes (dragging, selection, dimensions, etc.)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds: FlowNode[]) => applyNodeChanges(changes, nds) as FlowNode[]);
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds: FlowEdge[]) => applyEdgeChanges(changes, eds) as FlowEdge[]);
    },
    [setEdges]
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
    nodes,
    edges,
    selectedNodeId,
    rules,
    evaluationTrace,
    isDirty,
    setNodes,
    setEdges,
    setSelectedNodeId,
    setRules,
    setEvaluationTrace,
    setDirty,
    rulesToFlow,
    highlightPath,
    clearHighlights,
    loadRules,
    updateRuleOrder,
    onNodesChange,
    onEdgesChange,
  };
}
