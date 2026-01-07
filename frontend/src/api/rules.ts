/**
 * Rules API - CRUD operations for fraud detection rules
 */

import apiClient from './client';
import type { Rule, RulesConfig } from '../types';

export const rulesAPI = {
  /**
   * Get all rules
   */
  async getRules(version: string = 'v1'): Promise<RulesConfig> {
    const response = await apiClient.get<RulesConfig>(`/api/v1/rules`, {
      params: { version },
    });
    return response.data;
  },

  /**
   * Get a specific rule by ID
   */
  async getRule(ruleId: string, version: string = 'v1'): Promise<Rule> {
    const response = await apiClient.get<Rule>(`/api/v1/rules/${ruleId}`, {
      params: { version },
    });
    return response.data;
  },

  /**
   * Create a new rule
   */
  async createRule(
    rule: Omit<Rule, 'id'> & { id?: string },
    version: string = 'v1',
    position?: number
  ): Promise<{ status: string; rule_id: string; message: string }> {
    const response = await apiClient.post('/api/v1/rules', rule, {
      params: { version, position },
    });
    return response.data;
  },

  /**
   * Update an existing rule
   */
  async updateRule(
    ruleId: string,
    rule: Rule,
    version: string = 'v1'
  ): Promise<{ status: string; rule_id: string; message: string }> {
    const response = await apiClient.put(`/api/v1/rules/${ruleId}`, rule, {
      params: { version },
    });
    return response.data;
  },

  /**
   * Delete a rule
   */
  async deleteRule(
    ruleId: string,
    version: string = 'v1'
  ): Promise<{ status: string; rule_id: string; message: string }> {
    const response = await apiClient.delete(`/api/v1/rules/${ruleId}`, {
      params: { version },
    });
    return response.data;
  },

  /**
   * Reorder rules
   */
  async reorderRules(
    ruleIds: string[],
    version: string = 'v1'
  ): Promise<{ status: string; rule_count: number; message: string }> {
    const response = await apiClient.post(
      '/api/v1/rules/reorder',
      ruleIds,
      {
        params: { version },
      }
    );
    return response.data;
  },

  /**
   * Validate a rule without saving
   */
  async validateRule(rule: Partial<Rule>): Promise<{ valid: boolean; errors: string[] }> {
    const response = await apiClient.post<{ valid: boolean; errors: string[] }>(
      '/api/v1/rules/validate',
      rule
    );
    return response.data;
  },

  /**
   * Get next available rule ID
   */
  async getNextRuleId(version: string = 'v1'): Promise<string> {
    const response = await apiClient.get<{ next_id: string }>(
      '/api/v1/rules/metadata/next-id',
      {
        params: { version },
      }
    );
    return response.data.next_id;
  },
};

export default rulesAPI;
