from pydantic import BaseModel, Field
from typing import Literal, Optional, Any
from enum import Enum

class Decision(str, Enum):
    ALLOW = "ALLOW"
    REVIEW = "REVIEW"
    BLOCK = "BLOCK"

class Confidence(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class RuleResult(BaseModel):
    """Output from rule engine (deterministic)"""
    transaction_id: str
    matched_rule_id: str
    matched_rule_name: str
    risk_score: int = Field(ge=0, le=100)
    decision: Decision
    rule_reason: str

class LLMExplanation(BaseModel):
    """Structured output from LLM"""
    human_readable_explanation: str
    confidence: Confidence
    needs_human_review: bool
    clarifying_questions: list[str] = Field(default_factory=list)
    additional_context: Optional[str] = None

class FinalDecisionOutput(BaseModel):
    """Combined output for each transaction"""
    transaction_id: str
    risk_score: int
    decision: Decision
    rule_matched: str
    rule_reason: str
    llm_explanation: str
    confidence: Confidence
    needs_human_review: bool
    clarifying_questions: list[str]

class ConditionEvaluation(BaseModel):
    """Result of evaluating a single condition"""
    field: str
    operator: str
    expected_value: Any
    actual_value: Any
    passed: bool

class RuleEvaluation(BaseModel):
    """Result of evaluating a single rule"""
    rule_id: str
    rule_name: str
    conditions: list[ConditionEvaluation]
    logic: str
    matched: bool
    timestamp_ms: float

class EvaluationTrace(BaseModel):
    """Complete trace of rule evaluation process"""
    transaction_id: str
    evaluated_rules: list[RuleEvaluation]
    matched_rule_index: int  # Index in evaluated_rules list
    total_evaluation_time_ms: float
    config_version: str