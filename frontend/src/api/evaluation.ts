/**
 * Evaluation API - Transaction evaluation and LLM explanations
 */

import apiClient from './client';
import type {
  Transaction,
  EvaluationResponse,
  BatchEvaluationResponse,
  ExplanationResponse,
  RuleResult,
} from '../types';

export const evaluationAPI = {
  /**
   * Evaluate a single transaction
   */
  async evaluateTransaction(
    transaction: Transaction,
    enableTrace: boolean = true,
    version: string = 'v1'
  ): Promise<EvaluationResponse> {
    const response = await apiClient.post<EvaluationResponse>(
      '/api/v1/evaluate',
      transaction,
      {
        params: { enable_trace: enableTrace, version },
      }
    );
    return response.data;
  },

  /**
   * Evaluate multiple transactions
   */
  async evaluateBatch(
    transactions: Transaction[],
    enableTrace: boolean = true,
    version: string = 'v1'
  ): Promise<BatchEvaluationResponse> {
    const response = await apiClient.post<BatchEvaluationResponse>(
      '/api/v1/evaluate/batch',
      transactions,
      {
        params: { enable_trace: enableTrace, version },
      }
    );
    return response.data;
  },

  /**
   * Generate LLM explanation for a transaction result
   */
  async generateExplanation(
    transaction: Transaction,
    result: RuleResult
  ): Promise<ExplanationResponse> {
    const response = await apiClient.post<ExplanationResponse>('/api/v1/explain', {
      transaction,
      result,
    });
    return response.data;
  },
};

export default evaluationAPI;
