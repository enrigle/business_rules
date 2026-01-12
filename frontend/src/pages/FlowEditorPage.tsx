import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rulesAPI } from '../api';
import { useFlowEditor } from '../hooks/useFlowEditor';
import FlowCanvas from '../components/flow-editor/FlowCanvas';
import RuleEditPanel from '../components/flow-editor/RuleEditPanel';
import EvaluationOverlay from '../components/flow-editor/EvaluationOverlay';
import type { EvaluationTrace } from '../types';

export default function FlowEditorPage() {
  const queryClient = useQueryClient();
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [showNewRulePanel, setShowNewRulePanel] = useState(false);

  const {
    rules,
    loadRules,
    rulesToFlow,
    isDirty,
    setDirty,
  } = useFlowEditor();

  // Compute nodes and edges from rules
  const { nodes, edges } = useMemo(() => {
    if (rules.length === 0) return { nodes: [], edges: [] };
    return rulesToFlow(rules);
  }, [rules, rulesToFlow]);

  // Fetch rules from API
  const { data: rulesData, isLoading, error } = useQuery({
    queryKey: ['rules'],
    queryFn: () => rulesAPI.getRules('v1'),
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: (ruleIds: string[]) => rulesAPI.reorderRules(ruleIds, 'v1'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      setDirty(false);
    },
  });

  // Load rules into flow editor when data arrives
  useEffect(() => {
    if (rulesData?.rules) {
      loadRules(rulesData.rules);
    }
  }, [rulesData, loadRules]);

  // Handle node click
  const handleNodeClick = useCallback((nodeId: string) => {
    if (nodeId.startsWith('rule-')) {
      setSelectedRuleId(nodeId.replace('rule-', ''));
      setShowNewRulePanel(false);
    }
  }, []);

  // Handle evaluation (temporarily disabled - highlighting feature needs refactor)
  const handleEvaluate = useCallback(
    (trace: EvaluationTrace) => {
      console.log('Evaluation trace:', trace);
      // TODO: Implement highlighting without Zustand state
    },
    []
  );

  // Handle save reordering
  const handleSaveOrder = () => {
    const ruleIds = rules.map((r) => r.id);
    reorderMutation.mutate(ruleIds);
  };

  // Get selected rule
  const selectedRule = selectedRuleId ? rules.find((r) => r.id === selectedRuleId) : null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow z-20">
        <div className="max-w-full mx-auto py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Visual Rule Editor</h1>
            {isDirty && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowNewRulePanel(true);
                setSelectedRuleId(null);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
            >
              + New Rule
            </button>

            {isDirty && (
              <button
                onClick={handleSaveOrder}
                disabled={reorderMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
              >
                {reorderMutation.isPending ? 'Saving...' : 'Save Order'}
              </button>
            )}

            <Link
              to="/dashboard"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Flow canvas */}
        <div className="flex-1 relative h-full">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading rules...</div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-500">Error loading rules</div>
            </div>
          )}

          {!isLoading && !error && nodes.length > 0 && (
            <>
              <FlowCanvas
                initialNodes={nodes}
                initialEdges={edges}
                onNodeClick={handleNodeClick}
              />
              <EvaluationOverlay onEvaluate={handleEvaluate} onClear={() => console.log('Clear highlights')} />
            </>
          )}
        </div>

        {/* Edit panel */}
        {(selectedRule || showNewRulePanel) && (
          <RuleEditPanel
            rule={selectedRule || null}
            isNew={showNewRulePanel}
            onClose={() => {
              setSelectedRuleId(null);
              setShowNewRulePanel(false);
            }}
          />
        )}
      </div>

      {/* Footer stats */}
      <footer className="bg-white border-t px-6 py-2 z-20">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-6">
            <span>
              <strong>{rules.length}</strong> rules
            </span>
            <span>
              <strong>{rules.filter((r) => r.outcome.decision === 'ALLOW').length}</strong> ALLOW
            </span>
            <span>
              <strong>{rules.filter((r) => r.outcome.decision === 'REVIEW').length}</strong> REVIEW
            </span>
            <span>
              <strong>{rules.filter((r) => r.outcome.decision === 'BLOCK').length}</strong> BLOCK
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Drag nodes to reorder • Click rule nodes to edit
          </div>
        </div>
      </footer>
    </div>
  );
}
