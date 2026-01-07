import { useQuery } from '@tanstack/react-query';
import { rulesAPI } from '../api';
import { Link } from 'react-router-dom';
import type { RulesConfig } from '../types';

export default function DashboardPage() {
  const { data: rulesConfig, isLoading, error } = useQuery<RulesConfig>({
    queryKey: ['rules', 'v1'],
    queryFn: () => rulesAPI.getRules('v1'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading rules...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">
          Error loading rules: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  const ruleCount = rulesConfig?.rules.length || 0;
  const allowRules = rulesConfig?.rules.filter(r => r.outcome.decision === 'ALLOW').length || 0;
  const reviewRules = rulesConfig?.rules.filter(r => r.outcome.decision === 'REVIEW').length || 0;
  const blockRules = rulesConfig?.rules.filter(r => r.outcome.decision === 'BLOCK').length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Fraud Detection Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500 truncate">Total Rules</div>
                  <div className="mt-1 text-3xl font-semibold text-gray-900">{ruleCount}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500 truncate">Allow Rules</div>
                  <div className="mt-1 text-3xl font-semibold text-green-600">{allowRules}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500 truncate">Review Rules</div>
                  <div className="mt-1 text-3xl font-semibold text-yellow-600">{reviewRules}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500 truncate">Block Rules</div>
                  <div className="mt-1 text-3xl font-semibold text-red-600">{blockRules}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-8">
          <Link
            to="/flow-editor"
            className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Visual Flow Editor</h3>
              <p className="text-sm text-gray-500">
                Edit fraud detection rules using a visual flowchart interface with drag-and-drop
                nodes.
              </p>
            </div>
          </Link>

          <Link
            to="/test-runner"
            className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Test Runner</h3>
              <p className="text-sm text-gray-500">
                Test transactions against your rules and visualize execution traces with color-coded
                paths.
              </p>
            </div>
          </Link>
        </div>

        {/* Rules List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Rules Configuration</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Version: {rulesConfig?.version || 'v1'} | Decision Logic:{' '}
              {rulesConfig?.decision_logic || 'first-match-wins'}
            </p>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {rulesConfig?.rules.map((rule, index) => (
                <li key={rule.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 mr-3">#{index + 1}</span>
                        <span className="text-sm font-medium text-gray-900">{rule.name}</span>
                        <span className="ml-2 text-xs text-gray-500">({rule.id})</span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>
                          {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}{' '}
                          ({rule.logic})
                        </span>
                        <span className="mx-2">→</span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            rule.outcome.decision === 'ALLOW'
                              ? 'bg-green-100 text-green-800'
                              : rule.outcome.decision === 'REVIEW'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {rule.outcome.decision}
                        </span>
                        <span className="ml-2 text-xs">
                          (Risk: {rule.outcome.risk_score}, Reason: {rule.outcome.reason})
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
