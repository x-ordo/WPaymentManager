/**
 * LSSP Legal Grounds API
 */

import type { ApiResponse } from '../client';
import { apiClient } from '../client';
import type { CaseLegalGroundSummaryResponse, LegalGround } from './types';

/**
 * List all available legal grounds
 */
export async function getLegalGrounds(): Promise<ApiResponse<LegalGround[]>> {
  return apiClient.get<LegalGround[]>('/lssp/legal-grounds');
}

/**
 * Get a specific legal ground by ID
 */
export async function getLegalGround(groundId: string): Promise<ApiResponse<LegalGround>> {
  return apiClient.get<LegalGround>(`/lssp/legal-grounds/${groundId}`);
}

/**
 * Get legal ground analysis for a case
 */
export async function getCaseLegalGroundSummary(
  caseId: string
): Promise<ApiResponse<CaseLegalGroundSummaryResponse>> {
  return apiClient.get(`/lssp/cases/${caseId}/legal-ground-summary`);
}
