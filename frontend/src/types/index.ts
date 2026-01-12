/**
 * TypeScript types matching Python Pydantic models
 * These types ensure type safety between frontend and backend
 */

// Type unions (verbatimModuleSyntax doesn't allow enums)
export type Decision = "ALLOW" | "REVIEW" | "BLOCK";

export type Confidence = "HIGH" | "MEDIUM" | "LOW";

// Rule Configuration Types
export interface Condition {
  field: string;
  operator: ">" | "<" | ">=" | "<=" | "==" | "!=" | "in" | "not_in";
  value: string | number | boolean | string[];
}

export interface RuleOutcome {
  risk_score: number;
  decision: Decision;
  reason: string;
}

export interface Rule {
  id: string;
  name: string;
  conditions: Condition[];
  logic: "AND" | "OR" | "ALWAYS";
  outcome: RuleOutcome;
}

export interface RulesConfig {
  version: string;
  domain: string;
  created_at: string;
  features: Record<string, any>;
  rules: Rule[];
}

// Evaluation Types
export interface RuleResult {
  transaction_id: string;
  matched_rule_id: string;
  matched_rule_name: string;
  risk_score: number;
  decision: Decision;
  rule_reason: string;
}

export interface ConditionEvaluation {
  field: string;
  operator: string;
  expected_value: any;
  actual_value: any;
  passed: boolean;
}

export interface RuleEvaluation {
  rule_id: string;
  rule_name: string;
  conditions: ConditionEvaluation[];
  logic: string;
  matched: boolean;
  timestamp_ms: number;
}

export interface EvaluationTrace {
  transaction_id: string;
  evaluated_rules: RuleEvaluation[];
  matched_rule_index: number;
  total_evaluation_time_ms: number;
  config_version: string;
}

// LLM Explanation Types
export interface LLMExplanation {
  human_readable_explanation: string;
  confidence: Confidence;
  needs_human_review: boolean;
  clarifying_questions: string[];
  additional_context?: string;
}

// Transaction Types
export interface Transaction {
  transaction_id: string;
  transaction_amount: number;
  transaction_velocity_24h: number;
  merchant_category: "retail" | "travel" | "gambling" | "crypto" | "electronics";
  is_new_device: boolean;
  country_mismatch: boolean;
  account_age_days?: number;
  account_country?: string;
  transaction_country?: string;
  timestamp?: string;
}

// API Response Types
export interface EvaluationResponse {
  result: RuleResult;
  trace: EvaluationTrace | null;
}

export interface BatchEvaluationResponse {
  results: RuleResult[];
  traces: (EvaluationTrace | null)[];
  count: number;
}

export interface ExplanationResponse {
  explanation: LLMExplanation;
}

export interface GenerateTransactionsResponse {
  transactions: Transaction[];
  count: number;
}

export interface FieldInfo {
  type: string;
  description: string;
  required: boolean;
  validation?: string;
}

export interface FieldsResponse {
  fields: Record<string, FieldInfo>;
}

// Validation Types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: Transaction;
}

// API Error Type
export interface APIError {
  detail: string | { errors: string[] };
}
