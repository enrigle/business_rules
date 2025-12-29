# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rule-based fraud detection engine with LLM explanations. **Critical anti-hallucination principle**: LLM never computes risk scores or makes decisions—only explains deterministic rule outcomes.

## Architecture

3-layer design ensures LLM cannot influence decisions:

1. **Rule Engine** (`src/business_rules/rule_engine.py`): Evaluates YAML rules, outputs `RuleResult` with risk score + decision
2. **LLM Explainer** (`src/business_rules/llm_explainer.py`): Receives `RuleResult`, generates human-readable `LLMExplanation`
3. **Models** (`src/business_rules/models.py`): Pydantic schemas enforce structured I/O, prevent hallucinations

Data flow: Transaction → Rule Engine → RuleResult → LLM → LLMExplanation → FinalDecisionOutput

## Project Structure

```
src/business_rules/     # Core package (framework-agnostic)
streamlit/              # Web interface
notebooks/              # Jupyter experiments
config/                 # YAML rule definitions
tests/                  # Test suite
docs/                   # Documentation
```

## Rule Configuration

Rules in `config/rules_v1.yaml`:
- Decision tree structure (first match wins)
- Must have DEFAULT rule with `logic: ALWAYS` as final fallback
- Operators: `>`, `<`, `>=`, `<=`, `==`, `!=`, `in`, `not_in`
- Logics: `AND`, `OR`, `ALWAYS`

## Development Commands

```bash
# Setup
pip install -e ".[streamlit,notebook,dev]"

# Environment
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env

# Run Streamlit app
cd streamlit && streamlit run app.py

# Run notebook
jupyter notebook notebooks/decision_engine.ipynb

# Format/lint
black src/
ruff check src/

# Run tests
pytest
```

## Key Constraints

- **No placeholders**: Complete implementations only, no `pass` or `TODO`
- **Structured output**: LLM uses Pydantic `LLMExplanation` with `Confidence` enum (not float probabilities)
- **Import pattern**: Use `from business_rules import ...` for core package
- **Rule engine isolation**: `RuleEngine.evaluate()` never calls LLM
- **LLM prompt structure**: Always includes transaction JSON + existing `RuleResult` to prevent decision override
- **Framework agnostic core**: Core package (`src/business_rules/`) has no Streamlit/notebook dependencies

## Common Pitfalls

- Changing `LLMExplainer` to compute risk scores → violates architecture
- Adding LLM-based "override" logic → defeats deterministic guarantee
- Using `confidence` field to adjust decisions → LLM only assesses explanation quality
- Missing DEFAULT rule → `evaluate()` raises ValueError
- Mixing UI code into core package → breaks framework independence
