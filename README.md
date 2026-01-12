# Business Rules - Fraud Detection Engine

Rule-based fraud detection engine with LLM explanations and visual flowchart editor.

**Key principle**: LLM never computes risk scores or makes decisions—only explains deterministic rule outcomes.

## Quick Start

```bash
# Clone repo
git clone <repo-url>
cd business_rules

# Create virtual environment with uv
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -r requirements.txt
uv pip install --no-deps -e .

# Setup environment
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env

# Run FastAPI backend
cd backend
python main.py
# API available at http://localhost:8000
# Interactive API docs at http://localhost:8000/docs

# Run React frontend
cd frontend
npm install
cp .env.example .env  # Configure API URL
npm run dev
# UI available at http://localhost:5173
```

## Project Structure

```
business_rules/
├── src/business_rules/      # Core fraud detection engine (framework-agnostic)
│   ├── models.py            # Pydantic schemas with execution tracing
│   ├── rule_engine.py       # Deterministic rule evaluation
│   ├── llm_explainer.py     # Claude explanations
│   ├── data_generator.py    # Synthetic test data
│   ├── data_validator.py    # Input validation
│   └── config_manager.py    # Rule versioning & CRUD
│
├── backend/                 # FastAPI REST API
│   ├── main.py              # API server entry point
│   └── routers/             # API endpoints
│       ├── rules.py         # Rule CRUD operations
│       ├── evaluation.py    # Transaction evaluation
│       └── transactions.py  # Test data generation
│
├── frontend/                # React + ReactFlow UI (Phase 2)
│   ├── src/
│   │   ├── components/      # ReactFlow nodes, UI components
│   │   ├── pages/           # Flow editor, test runner
│   │   ├── api/             # API client layer
│   │   └── stores/          # State management (Zustand)
│   └── package.json
│
├── config/                  # Rule definitions
│   └── rules_v1.yaml        # Fraud detection rules
│
├── notebooks/              # Jupyter experiments
│   └── decision_engine.ipynb
│
├── tests/                  # Test suite
│
└── docs/                   # Documentation
    ├── ARCHITECTURE.md
    ├── HOW_TO_USE.md
    └── three_stage_architecture.md
```

## Architecture

### Backend: FastAPI REST API

The Python backend provides a REST API wrapping the core business logic:

**Available Endpoints:**
- `GET /api/v1/rules` - List all rules
- `POST /api/v1/rules` - Create rule
- `PUT /api/v1/rules/{id}` - Update rule
- `DELETE /api/v1/rules/{id}` - Delete rule
- `POST /api/v1/rules/reorder` - Reorder decision tree
- `POST /api/v1/evaluate` - Evaluate transaction with execution trace
- `POST /api/v1/evaluate/batch` - Batch evaluation
- `POST /api/v1/explain` - Generate LLM explanation
- `POST /api/v1/transactions/generate` - Generate test data
- `GET /api/v1/fields` - Get field metadata

### Frontend: React + ReactFlow

Modern visual flowchart editor for building fraud detection rules:

**Current Features (Phase 3 Complete):**
- ✅ Dashboard with rule statistics and navigation
- ✅ TypeScript API client with TanStack Query
- ✅ React Router for page navigation
- ✅ Visual drag-and-drop rule editor with ReactFlow
- ✅ Real-time execution tracing with color-coded paths
- ✅ Transaction testing with visual trace overlay
- ✅ Auto-layout for complex decision trees (dagre algorithm)
- ✅ Form-based rule editing with live preview
- ✅ CRUD operations (Create, Read, Update, Delete rules)
- ✅ Rule reordering via drag-and-drop
- ✅ Path highlighting for matched rules (green glow)

**Custom Node Types:**
- TransactionInputNode (blue) - Start node showing input fields
- RuleNode (purple) - Rule cards with conditions and decisions
- ConditionGroupNode (orange/pink) - AND/OR logic visualization
- DecisionOutputNode (green/yellow/red) - ALLOW/REVIEW/BLOCK outcomes

**Upcoming Features (Phase 4):**
- Batch transaction testing
- Rule performance metrics and analytics
- Side-by-side rule comparison
- Export test results to CSV

**Tech Stack:**
- React 19.2 + TypeScript + Vite
- ReactFlow 12.10 for flowchart visualization
- TanStack Query for server state management
- Zustand for client state management
- dagre for auto-layout algorithm
- React Router v7 for navigation
- Tailwind CSS for styling

## Features

- **Deterministic Rule Engine**: YAML-based rules with first-match-wins logic
- **Execution Tracing**: Complete path tracking with condition-level details
- **LLM Explanations**: Human-readable explanations from Claude Sonnet 4
- **REST API**: FastAPI backend with OpenAPI documentation
- **Visual Editor**: React + ReactFlow flowchart interface with drag-and-drop
- **Live Testing**: Instant transaction evaluation with path highlighting
- **Synthetic Data**: Generate realistic fraud test data
- **Auto-Layout**: Dagre algorithm for automatic node positioning
- **Anti-hallucination Design**: LLM never influences decisions

## API Usage

### Start the Backend

```bash
cd backend
python main.py
```

API runs at `http://localhost:8000` with interactive docs at `/docs`.

### Example: Evaluate Transaction

```bash
curl -X POST http://localhost:8000/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn_001",
    "transaction_amount": 6000,
    "transaction_velocity_24h": 1,
    "merchant_category": "crypto",
    "is_new_device": true,
    "country_mismatch": false,
    "account_age_days": 45
  }'
```

Response includes both the `result` (risk score, decision, reason) and `trace` (execution path with condition evaluations).

### Example: List Rules

```bash
curl http://localhost:8000/api/v1/rules
```

Returns all rules from `config/rules_v1.yaml`.

## Development

```bash
# Install dev dependencies
uv pip install -e ".[dev,api]"

# Format code
black src/

# Lint
ruff check src/

# Run tests
pytest

# Run backend with auto-reload
cd backend
uvicorn main:app --reload
```

## Jupyter Notebooks

```bash
# Install notebook dependencies
uv pip install -e ".[notebook]"

# Launch Jupyter
jupyter notebook notebooks/decision_engine.ipynb
```

Notebooks provide interactive exploration of the rule engine and data generation.

## Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Technical design and 3-layer architecture
- **[HOW_TO_USE.md](docs/HOW_TO_USE.md)** - Guide for fraud analysts
- **[API Docs](http://localhost:8000/docs)** - Interactive OpenAPI documentation (when backend running)

## Roadmap

- ✅ Phase 1: FastAPI backend with REST API
- ✅ Phase 2: React frontend foundation with routing, dashboard, and API client
- ✅ Phase 3: ReactFlow visual editor with drag-and-drop nodes, live testing, and CRUD operations
- ⏳ Phase 4: Transaction test runner with batch testing and analytics
- ⏳ Phase 5: Docker setup and production deployment

## License

[Your license here]
