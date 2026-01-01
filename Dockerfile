# Multi-stage build for smaller, more secure production image

# Stage 1: Builder - Install dependencies
FROM python:3.10-slim as builder

WORKDIR /app

# Copy dependency files
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime - Minimal production image
FROM python:3.10-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY src/ ./src/
COPY config/ ./config/
COPY streamlit/ ./streamlit/
COPY pyproject.toml .

# Install package in editable mode (no dependencies needed - already installed)
RUN pip install --no-deps -e .

# Expose Streamlit default port
EXPOSE 8501

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8501/_stcore/health')"

# Run Streamlit app
CMD ["streamlit", "run", "streamlit/app.py", "--server.address", "0.0.0.0"]
