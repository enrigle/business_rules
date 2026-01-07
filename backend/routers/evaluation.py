"""
Evaluation Router - Transaction evaluation and tracing
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Any
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from business_rules import RuleEngine, LLMExplainer
from business_rules.models import RuleResult, EvaluationTrace, LLMExplanation
import os

# Initialize router
router = APIRouter()

# Config path
config_path = Path(__file__).parent.parent.parent / "config"

@router.post("/evaluate", response_model=Dict[str, Any])
async def evaluate_transaction(
    transaction: Dict[str, Any],
    enable_trace: bool = Query(default=True, description="Enable execution tracing"),
    version: str = Query(default="v1", description="Config version")
):
    """
    Evaluate a single transaction against rules

    Request body should contain transaction fields:
    - transaction_id: str
    - transaction_amount: float
    - transaction_velocity_24h: int
    - merchant_category: str
    - is_new_device: bool
    - country_mismatch: bool
    - account_age_days: int (optional)

    Returns:
    - result: RuleResult object
    - trace: EvaluationTrace object (if enable_trace=True)
    """
    try:
        # Load rule engine
        rules_file = config_path / f"rules_{version}.yaml"
        if not rules_file.exists():
            raise HTTPException(status_code=404, detail=f"Config version {version} not found")

        engine = RuleEngine(str(rules_file))

        # Evaluate with or without trace
        if enable_trace:
            result, trace = engine.evaluate_with_trace(transaction, enable_trace=True)
            return {
                "result": result.model_dump(),
                "trace": trace.model_dump() if trace else None
            }
        else:
            result = engine.evaluate(transaction)
            return {
                "result": result.model_dump(),
                "trace": None
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@router.post("/evaluate/batch", response_model=Dict[str, Any])
async def evaluate_batch(
    transactions: List[Dict[str, Any]],
    enable_trace: bool = Query(default=True),
    version: str = Query(default="v1")
):
    """
    Evaluate multiple transactions

    Returns:
    - results: List of RuleResult objects
    - traces: List of EvaluationTrace objects (if enable_trace=True)
    """
    try:
        # Load rule engine
        rules_file = config_path / f"rules_{version}.yaml"
        if not rules_file.exists():
            raise HTTPException(status_code=404, detail=f"Config version {version} not found")

        engine = RuleEngine(str(rules_file))

        # Batch evaluate
        if enable_trace:
            results_with_traces = engine.evaluate_batch_with_trace(transactions, enable_trace=True)
            results = [r.model_dump() for r, t in results_with_traces]
            traces = [t.model_dump() if t else None for r, t in results_with_traces]
            return {
                "results": results,
                "traces": traces,
                "count": len(results)
            }
        else:
            results = engine.evaluate_batch(transactions)
            return {
                "results": [r.model_dump() for r in results],
                "traces": None,
                "count": len(results)
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch evaluation failed: {str(e)}")

@router.post("/explain", response_model=Dict[str, Any])
async def generate_explanation(
    transaction: Dict[str, Any],
    result: Dict[str, Any]
):
    """
    Generate LLM explanation for a transaction result

    Request body should contain:
    - transaction: Original transaction data
    - result: RuleResult from evaluation

    Requires ANTHROPIC_API_KEY environment variable
    """
    try:
        # Check for API key
        if not os.environ.get('ANTHROPIC_API_KEY'):
            raise HTTPException(
                status_code=503,
                detail="LLM explanations unavailable: ANTHROPIC_API_KEY not set"
            )

        # Convert result dict back to RuleResult
        from business_rules.models import Decision
        rule_result = RuleResult(
            transaction_id=result.get('transaction_id'),
            matched_rule_id=result.get('matched_rule_id'),
            matched_rule_name=result.get('matched_rule_name'),
            risk_score=result.get('risk_score'),
            decision=Decision(result.get('decision')),
            rule_reason=result.get('rule_reason')
        )

        # Generate explanation
        explainer = LLMExplainer()
        explanation = explainer.generate_explanation(transaction, rule_result)

        return {
            "explanation": explanation.model_dump()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation generation failed: {str(e)}")
