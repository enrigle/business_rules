/**
 * Transactions API - Test data generation and validation
 */

import apiClient from './client';
import type {
  Transaction,
  GenerateTransactionsResponse,
  ValidationResult,
  FieldsResponse,
} from '../types';

export const transactionsAPI = {
  /**
   * Generate random test transactions
   */
  async generateTransactions(count: number = 5): Promise<GenerateTransactionsResponse> {
    const response = await apiClient.post<GenerateTransactionsResponse>(
      '/api/v1/transactions/generate',
      null,
      {
        params: { count },
      }
    );
    return response.data;
  },

  /**
   * Validate a transaction
   */
  async validateTransaction(transaction: Transaction): Promise<ValidationResult> {
    const response = await apiClient.post<ValidationResult>(
      '/api/v1/transactions/validate',
      transaction
    );
    return response.data;
  },

  /**
   * Get field metadata for form generation
   */
  async getFields(): Promise<FieldsResponse> {
    const response = await apiClient.get<FieldsResponse>('/api/v1/fields');
    return response.data;
  },
};

export default transactionsAPI;
