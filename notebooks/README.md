# Notebooks

Jupyter notebooks for experimentation and demos.

## decision_engine.ipynb

Demo notebook showing end-to-end fraud detection workflow:
- Generate synthetic transaction data
- Evaluate with rule engine
- Generate LLM explanations
- Display results and review items

## Running

From project root:

```bash
# Install with notebook dependencies
pip install -e ".[notebook]"

# Launch Jupyter
jupyter notebook notebooks/decision_engine.ipynb
```
