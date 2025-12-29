# Streamlit Fraud Detection App

Web interface for fraud detection rule management and testing.

## Running the App

From the project root:

```bash
# Install dependencies (with streamlit extras)
pip install -e ".[streamlit]"

# Set up environment
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env

# Run Streamlit app
cd streamlit
streamlit run app.py
```

## Features

- **Rule Builder**: Step-by-step wizard to create fraud detection rules
- **Dashboard**: View and manage rules (coming soon)
- **Test Transactions**: Run transactions through rule engine (coming soon)
- **Audit Log**: Session-based transaction history (coming soon)
