/**
 * LSSP Keypoints API
 */

import type { ApiResponse } from '../client';
import { apiClient } from '../client';
import type {
  Keypoint,
  KeypointCreateRequest,
  KeypointListResponse,
  KeypointUpdateRequest,
} from './types';

/**
 * List keypoints for a case
 */
export async function getKeypoints(
  caseId: string,
  params?: {
    verified_only?: boolean;
    ground_id?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ApiResponse<KeypointListResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.verified_only) searchParams.set('verified_only', 'true');
  if (params?.ground_id) searchParams.set('ground_id', params.ground_id);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const query = searchParams.toString();
  return apiClient.get<KeypointListResponse>(
    `/lssp/cases/${caseId}/keypoints${query ? `?${query}` : ''}`
  );
}

/**
 * Get a specific keypoint
 */
export async function getKeypoint(
  caseId: string,
  keypointId: string
): Promise<ApiResponse<Keypoint>> {
  return apiClient.get<Keypoint>(`/lssp/cases/${caseId}/keypoints/${keypointId}`);
}

/**
 * Create a new keypoint (manual)
 */
export async function createKeypoint(
  caseId: string,
  data: KeypointCreateRequest
): Promise<ApiResponse<Keypoint>> {
  return apiClient.post<Keypoint>(`/lssp/cases/${caseId}/keypoints`, data);
}

/**
 * Update a keypoint
 */
export async function updateKeypoint(
  caseId: string,
  keypointId: string,
  data: KeypointUpdateRequest
): Promise<ApiResponse<Keypoint>> {
  return apiClient.patch<Keypoint>(`/lssp/cases/${caseId}/keypoints/${keypointId}`, data);
}

/**
 * Delete a keypoint
 */
export async function deleteKeypoint(
  caseId: string,
  keypointId: string
): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/lssp/cases/${caseId}/keypoints/${keypointId}`);
}

/**
 * Verify/unverify a keypoint
 */
export async function verifyKeypoint(
  caseId: string,
  keypointId: string,
  verified: boolean
): Promise<ApiResponse<Keypoint>> {
  return apiClient.post<Keypoint>(
    `/lssp/cases/${caseId}/keypoints/${keypointId}/verify`,
    { verified }
  );
}

/**
 * Link a keypoint to legal grounds
 */
export async function linkKeypointToGrounds(
  caseId: string,
  keypointId: string,
  groundIds: string[]
): Promise<ApiResponse<Keypoint>> {
  return apiClient.post<Keypoint>(
    `/lssp/cases/${caseId}/keypoints/${keypointId}/grounds`,
    { ground_ids: groundIds }
  );
}
