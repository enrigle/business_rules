"""
Transactions Router - Test data generation and field metadata
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Any
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from business_rules.data_generator import FraudDataGenerator
from business_rules.data_validator import DataValidator

# Initialize router
router = APIRouter()

# Initialize data generator and validator
data_generator = FraudDataGenerator()
data_validator = DataValidator()

@router.post("/transactions/generate")
async def generate_transactions(
    count: int = Query(default=5, ge=1, le=100, description="Number of transactions to generate")
):
    """
    Generate random test transactions

    Query params:
    - count: Number of transactions (1-100)

    Returns list of transaction dictionaries
    """
    try:
        df = data_generator.generate_dataset(n=count)
        transactions = df.to_dict('records')

        return {
            "transactions": transactions,
            "count": len(transactions)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate transactions: {str(e)}")

@router.post("/transactions/validate")
async def validate_transaction_endpoint(transaction: Dict[str, Any]):
    """
    Validate a transaction

    Returns:
    - valid: bool
    - errors: List of validation error messages
    - sanitized: Sanitized transaction data (if valid)
    """
    try:
        errors = data_validator.validate_transaction(transaction)
        is_valid = len(errors) == 0

        sanitized = None
        if is_valid:
            sanitized = data_validator.sanitize_transaction(transaction)

        return {
            "valid": is_valid,
            "errors": errors,
            "sanitized": sanitized
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@router.get("/fields")
async def get_fields():
    """
    Get field metadata for form generation

    Returns field names, types, constraints, and descriptions
    """
    try:
        field_info = data_validator.get_field_info()
        return {"fields": field_info}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get field info: {str(e)}")
