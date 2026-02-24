/**
 * LSSP AI Pipeline API
 */

import type { ApiResponse } from '../client';
import { apiClient } from '../client';
import type {
  Candidate,
  CandidateUpdateRequest,
  DraftGenerationRequest,
  DraftGenerationResponse,
  ExtractCandidatesRequest,
  ExtractionRun,
  KeypointExtractionRequest,
  KeypointExtractionResponse,
  PipelineRule,
  PipelineStats,
  PromoteCandidatesRequest,
  PromoteCandidatesResponse,
} from './types';

/**
 * Trigger keypoint extraction from evidence
 */
export async function extractKeypoints(
  caseId: string,
  data?: KeypointExtractionRequest
): Promise<ApiResponse<KeypointExtractionResponse>> {
  return apiClient.post<KeypointExtractionResponse>(
    `/lssp/cases/${caseId}/extract-keypoints`,
    data || {}
  );
}

/**
 * Generate a draft using AI
 */
export async function generateDraft(
  caseId: string,
  data: DraftGenerationRequest
): Promise<ApiResponse<DraftGenerationResponse>> {
  return apiClient.post<DraftGenerationResponse>(
    `/lssp/cases/${caseId}/generate-draft`,
    data
  );
}

/**
 * List all pipeline extraction rules
 */
export async function getPipelineRules(
  params?: {
    evidence_type?: string;
    kind?: string;
    enabled_only?: boolean;
  }
): Promise<ApiResponse<PipelineRule[]>> {
  const searchParams = new URLSearchParams();
  if (params?.evidence_type) searchParams.set('evidence_type', params.evidence_type);
  if (params?.kind) searchParams.set('kind', params.kind);
  if (params?.enabled_only !== undefined) searchParams.set('enabled_only', params.enabled_only.toString());

  const query = searchParams.toString();
  return apiClient.get<PipelineRule[]>(`/lssp/pipeline/rules${query ? `?${query}` : ''}`);
}

/**
 * List candidates for a case
 */
export async function getCandidates(
  caseId: string,
  params?: {
    evidence_id?: string;
    status?: string;
    kind?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ApiResponse<Candidate[]>> {
  const searchParams = new URLSearchParams();
  if (params?.evidence_id) searchParams.set('evidence_id', params.evidence_id);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.kind) searchParams.set('kind', params.kind);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const query = searchParams.toString();
  return apiClient.get<Candidate[]>(
    `/lssp/pipeline/cases/${caseId}/candidates${query ? `?${query}` : ''}`
  );
}

/**
 * Update a candidate (accept/reject/edit)
 */
export async function updateCandidate(
  caseId: string,
  candidateId: number,
  data: CandidateUpdateRequest
): Promise<ApiResponse<Candidate>> {
  return apiClient.patch<Candidate>(
    `/lssp/pipeline/cases/${caseId}/candidates/${candidateId}`,
    data
  );
}

/**
 * Promote accepted candidates to keypoints
 */
export async function promoteCandidates(
  caseId: string,
  data: PromoteCandidatesRequest
): Promise<ApiResponse<PromoteCandidatesResponse>> {
  return apiClient.post<PromoteCandidatesResponse>(
    `/lssp/pipeline/cases/${caseId}/promote`,
    data
  );
}

/**
 * Extract candidates from evidence
 */
export async function extractCandidates(
  caseId: string,
  evidenceId: string,
  data?: ExtractCandidatesRequest
): Promise<ApiResponse<ExtractionRun>> {
  return apiClient.post<ExtractionRun>(
    `/lssp/pipeline/cases/${caseId}/evidences/${evidenceId}/extract`,
    data || {}
  );
}

/**
 * Get pipeline statistics for a case
 */
export async function getPipelineStats(
  caseId: string
): Promise<ApiResponse<PipelineStats>> {
  return apiClient.get<PipelineStats>(`/lssp/pipeline/cases/${caseId}/stats`);
}

/**
 * Get extraction runs for a case
 */
export async function getExtractionRuns(
  caseId: string,
  params?: {
    evidence_id?: string;
    status?: string;
    limit?: number;
  }
): Promise<ApiResponse<ExtractionRun[]>> {
  const searchParams = new URLSearchParams();
  if (params?.evidence_id) searchParams.set('evidence_id', params.evidence_id);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const query = searchParams.toString();
  return apiClient.get<ExtractionRun[]>(
    `/lssp/pipeline/cases/${caseId}/extraction-runs${query ? `?${query}` : ''}`
  );
}
