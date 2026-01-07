import { Link } from 'react-router-dom';

export default function TestRunnerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Test Runner</h1>
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
              Transaction Test Runner - Coming in Phase 4
            </h3>
            <div className="space-y-4 text-sm text-gray-600">
              <p>
                This page will allow you to test transactions against your fraud detection rules and
                visualize the execution trace.
              </p>
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="font-medium text-gray-900 mb-2">Planned Features:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Generate random test transactions with realistic data</li>
                  <li>Manually input custom transaction data via form</li>
                  <li>Batch evaluation of multiple transactions</li>
                  <li>View detailed evaluation results with risk scores and decisions</li>
                  <li>Visual trace overlay on flowchart showing execution path</li>
                  <li>
                    Color-coded paths: green for matched conditions, red for unmatched, gray for
                    unevaluated
                  </li>
                  <li>Step-by-step execution breakdown with timing information</li>
                  <li>LLM-generated explanations for decisions</li>
                  <li>Export test results to JSON/CSV</li>
                </ul>
              </div>
              <p className="pt-4">
                The test runner will integrate with the backend evaluation API and display results
                both as structured data and as an annotated flowchart visualization.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
