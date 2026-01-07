import yaml
import time
from typing import Any, Optional, Tuple
from .models import RuleResult, Decision, EvaluationTrace, RuleEvaluation, ConditionEvaluation

class RuleEngine:
    OPERATORS = {
        ">": lambda a, b: a > b,
        "<": lambda a, b: a < b,
        ">=": lambda a, b: a >= b,
        "<=": lambda a, b: a <= b,
        "==": lambda a, b: a == b,
        "!=": lambda a, b: a != b,
        "in": lambda a, b: a in b,
        "not_in": lambda a, b: a not in b,
    }

    def __init__(self, config_path: str):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        self.rules = self.config['rules']
        self.version = self.config['version']

    def evaluate_condition(self, condition: dict, record: dict) -> bool:
        field = condition['field']
        operator = condition['operator']
        expected_value = condition['value']
        actual_value = record.get(field)

        if actual_value is None:
            return False

        op_func = self.OPERATORS.get(operator)
        if not op_func:
            raise ValueError(f"Unknown operator: {operator}")

        return op_func(actual_value, expected_value)

    def evaluate_condition_with_trace(self, condition: dict, record: dict) -> ConditionEvaluation:
        """Evaluate condition and return detailed trace"""
        field = condition['field']
        operator = condition['operator']
        expected_value = condition['value']
        actual_value = record.get(field)

        if actual_value is None:
            return ConditionEvaluation(
                field=field,
                operator=operator,
                expected_value=expected_value,
                actual_value=None,
                passed=False
            )

        op_func = self.OPERATORS.get(operator)
        if not op_func:
            raise ValueError(f"Unknown operator: {operator}")

        passed = op_func(actual_value, expected_value)

        return ConditionEvaluation(
            field=field,
            operator=operator,
            expected_value=expected_value,
            actual_value=actual_value,
            passed=passed
        )

    def evaluate_rule(self, rule: dict, record: dict) -> bool:
        if rule.get('logic') == 'ALWAYS':
            return True

        conditions = rule.get('conditions', [])
        if not conditions:
            return False

        results = [self.evaluate_condition(c, record) for c in conditions]

        if rule.get('logic') == 'AND':
            return all(results)
        elif rule.get('logic') == 'OR':
            return any(results)
        return False

    def evaluate_rule_with_trace(self, rule: dict, record: dict) -> RuleEvaluation:
        """Evaluate rule and return detailed trace"""
        start_time = time.time()

        if rule.get('logic') == 'ALWAYS':
            matched = True
            condition_evals = []
        else:
            conditions = rule.get('conditions', [])
            if not conditions:
                matched = False
                condition_evals = []
            else:
                condition_evals = [self.evaluate_condition_with_trace(c, record) for c in conditions]
                results = [ce.passed for ce in condition_evals]

                if rule.get('logic') == 'AND':
                    matched = all(results)
                elif rule.get('logic') == 'OR':
                    matched = any(results)
                else:
                    matched = False

        timestamp_ms = (time.time() - start_time) * 1000

        return RuleEvaluation(
            rule_id=rule['id'],
            rule_name=rule['name'],
            conditions=condition_evals,
            logic=rule.get('logic', 'AND'),
            matched=matched,
            timestamp_ms=timestamp_ms
        )

    def evaluate(self, record: dict) -> RuleResult:
        """Evaluate a single record against all rules"""
        transaction_id = record.get('transaction_id', 'unknown')
        
        for rule in self.rules:
            if self.evaluate_rule(rule, record):
                outcome = rule['outcome']
                return RuleResult(
                    transaction_id=transaction_id,
                    matched_rule_id=rule['id'],
                    matched_rule_name=rule['name'],
                    risk_score=outcome['risk_score'],
                    decision=Decision(outcome['decision']),
                    rule_reason=outcome['reason']
                )
        
        # Should never reach here if DEFAULT rule exists
        raise ValueError("No matching rule found and no DEFAULT rule defined")

    def evaluate_with_trace(self, record: dict, enable_trace: bool = True) -> Tuple[RuleResult, Optional[EvaluationTrace]]:
        """Evaluate a single record and optionally return execution trace

        Args:
            record: Transaction data dictionary
            enable_trace: If True, captures detailed execution trace (default: True)

        Returns:
            Tuple of (RuleResult, EvaluationTrace) if enable_trace=True
            Tuple of (RuleResult, None) if enable_trace=False
        """
        transaction_id = record.get('transaction_id', 'unknown')
        start_time = time.time()

        evaluated_rules = []
        matched_rule_index = -1
        result = None

        for idx, rule in enumerate(self.rules):
            if enable_trace:
                rule_eval = self.evaluate_rule_with_trace(rule, record)
                evaluated_rules.append(rule_eval)

                if rule_eval.matched and result is None:
                    matched_rule_index = idx
                    outcome = rule['outcome']
                    result = RuleResult(
                        transaction_id=transaction_id,
                        matched_rule_id=rule['id'],
                        matched_rule_name=rule['name'],
                        risk_score=outcome['risk_score'],
                        decision=Decision(outcome['decision']),
                        rule_reason=outcome['reason']
                    )
                    # Continue evaluating remaining rules for complete trace
            else:
                # Fast path - stop at first match
                if self.evaluate_rule(rule, record):
                    outcome = rule['outcome']
                    result = RuleResult(
                        transaction_id=transaction_id,
                        matched_rule_id=rule['id'],
                        matched_rule_name=rule['name'],
                        risk_score=outcome['risk_score'],
                        decision=Decision(outcome['decision']),
                        rule_reason=outcome['reason']
                    )
                    break

        if result is None:
            raise ValueError("No matching rule found and no DEFAULT rule defined")

        if enable_trace:
            total_time_ms = (time.time() - start_time) * 1000
            trace = EvaluationTrace(
                transaction_id=transaction_id,
                evaluated_rules=evaluated_rules,
                matched_rule_index=matched_rule_index,
                total_evaluation_time_ms=total_time_ms,
                config_version=self.version
            )
            return result, trace
        else:
            return result, None

    def evaluate_batch(self, records: list[dict]) -> list[RuleResult]:
        """Evaluate multiple records"""
        return [self.evaluate(record) for record in records]

    def evaluate_batch_with_trace(self, records: list[dict], enable_trace: bool = True) -> list[Tuple[RuleResult, Optional[EvaluationTrace]]]:
        """Evaluate multiple records with optional tracing"""
        return [self.evaluate_with_trace(record, enable_trace) for record in records]