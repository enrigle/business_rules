"""
FastAPI Backend for Business Rules Engine

This API wraps the existing business_rules Python package to provide
REST endpoints for the React frontend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path

# Add parent directory to path for business_rules import
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from routers import rules, evaluation, transactions

# Initialize FastAPI app
app = FastAPI(
    title="Business Rules API",
    description="Fraud detection rule engine with visual flowchart editing",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(rules.router, prefix="/api/v1", tags=["rules"])
app.include_router(evaluation.router, prefix="/api/v1", tags=["evaluation"])
app.include_router(transactions.router, prefix="/api/v1", tags=["transactions"])

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Business Rules API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
