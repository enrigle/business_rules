# Business Rules - Fraud Detection Engine

Rule-based fraud detection engine with LLM explanations.

**Key principle**: LLM never computes risk scores or makes decisions—only explains deterministic rule outcomes.

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd business_rules
pip install -e ".[streamlit,notebook,dev]"

# Setup environment
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env

# Run Streamlit app
cd streamlit
streamlit run app.py

# Or run Jupyter notebook
jupyter notebook notebooks/decision_engine.ipynb
```

## Project Structure

```
business_rules/
├── src/business_rules/      # Core fraud detection engine (framework-agnostic)
│   ├── models.py            # Pydantic schemas
│   ├── rule_engine.py       # Deterministic rule evaluation
│   ├── llm_explainer.py     # Claude explanations
│   ├── data_generator.py    # Synthetic test data
│   ├── data_validator.py    # Input validation
│   └── config_manager.py    # Rule versioning
│
├── config/                  # Rule definitions
│   └── rules_v1.yaml        # Fraud detection rules
│
├── streamlit/              # Web interface
│   ├── app.py              # Rule builder wizard
│   ├── pages/              # Dashboard, testing, audit log
│   └── src/visualizer.py   # UI-specific visualization
│
├── notebooks/              # Jupyter experiments
│   └── decision_engine.ipynb
│
├── tests/                  # Test suite (coming soon)
│
└── docs/                   # Documentation
    ├── ARCHITECTURE.md
    ├── HOW_TO_USE.md
    └── three_stage_architecture.md
```

## Features

- **Deterministic Rule Engine**: YAML-based rules with first-match-wins logic
- **LLM Explanations**: Human-readable explanations from Claude
- **Web Interface**: Streamlit app for rule management and testing
- **Synthetic Data**: Generate realistic fraud test data
- **Anti-hallucination Design**: LLM never influences decisions

## Development

```bash
# Install with dev dependencies
pip install -e ".[dev]"

# Format code
black src/

# Lint
ruff check src/

# Run tests (coming soon)
pytest
```

## Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Technical design and architecture
- **[HOW_TO_USE.md](docs/HOW_TO_USE.md)** - Guide for fraud analysts
- **[Streamlit README](streamlit/README.md)** - How to run the web app
- **[Notebooks README](notebooks/README.md)** - Jupyter notebook usage

## License

[Your license here]
