import { Link } from 'react-router-dom';

export default function FlowEditorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Visual Flow Editor</h1>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              ReactFlow Editor - Coming in Phase 3
            </h3>
            <div className="space-y-4 text-sm text-gray-600">
              <p>
                This page will contain a visual drag-and-drop flowchart editor built with ReactFlow.
              </p>
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="font-medium text-gray-900 mb-2">Planned Features:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Visual node-based rule editor (Entry, Rule, Outcome, Exit nodes)</li>
                  <li>Drag-and-drop interface for creating and connecting rules</li>
                  <li>Auto-layout with dagre algorithm</li>
                  <li>Inline editing panel for node properties</li>
                  <li>Real-time validation and error highlighting</li>
                  <li>YAML export/import for rule configurations</li>
                  <li>Color-coded execution trace overlay (green/red/gray paths)</li>
                </ul>
              </div>
              <p className="pt-4">
                The visual editor will convert YAML rules into an interactive flowchart, allowing
                you to visually see and edit the decision tree structure.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
