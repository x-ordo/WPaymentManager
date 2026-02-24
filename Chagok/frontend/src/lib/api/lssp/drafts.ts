/**
 * LSSP Drafts API
 */

import type { ApiResponse } from '../client';
import { apiClient } from '../client';
import type {
  Draft,
  DraftBlockInstance,
  DraftBlockUpdateRequest,
  DraftCreateRequest,
  DraftListResponse,
} from './types';

/**
 * List drafts for a case
 */
export async function getDrafts(
  caseId: string,
  params?: { status?: string; limit?: number; offset?: number }
): Promise<ApiResponse<DraftListResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const query = searchParams.toString();
  return apiClient.get<DraftListResponse>(
    `/lssp/cases/${caseId}/drafts${query ? `?${query}` : ''}`
  );
}

/**
 * Get a specific draft with all block instances
 */
export async function getDraft(caseId: string, draftId: string): Promise<ApiResponse<Draft>> {
  return apiClient.get<Draft>(`/lssp/cases/${caseId}/drafts/${draftId}`);
}

/**
 * Create a new draft (manual)
 */
export async function createDraft(
  caseId: string,
  data: DraftCreateRequest
): Promise<ApiResponse<Draft>> {
  return apiClient.post<Draft>(`/lssp/cases/${caseId}/drafts`, data);
}

/**
 * Update a draft block instance content
 */
export async function updateDraftBlock(
  caseId: string,
  draftId: string,
  blockInstanceId: string,
  data: DraftBlockUpdateRequest
): Promise<ApiResponse<DraftBlockInstance>> {
  return apiClient.patch<DraftBlockInstance>(
    `/lssp/cases/${caseId}/drafts/${draftId}/blocks/${blockInstanceId}`,
    data
  );
}

/**
 * Update draft status
 */
export async function updateDraftStatus(
  caseId: string,
  draftId: string,
  status: 'draft' | 'review' | 'final'
): Promise<ApiResponse<Draft>> {
  return apiClient.patch<Draft>(
    `/lssp/cases/${caseId}/drafts/${draftId}/status`,
    { status }
  );
}

/**
 * Delete a draft
 */
export async function deleteDraft(caseId: string, draftId: string): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/lssp/cases/${caseId}/drafts/${draftId}`);
}
