/**
 * LSSP Draft Templates API
 */

import type { ApiResponse } from '../client';
import { apiClient } from '../client';
import type { DraftTemplate, DraftTemplateWithBlocks } from './types';

/**
 * List available draft templates
 */
export async function getDraftTemplates(
  params?: { document_type?: string; active_only?: boolean }
): Promise<ApiResponse<DraftTemplate[]>> {
  const searchParams = new URLSearchParams();
  if (params?.document_type) searchParams.set('document_type', params.document_type);
  if (params?.active_only !== undefined) searchParams.set('active_only', params.active_only.toString());

  const query = searchParams.toString();
  return apiClient.get<DraftTemplate[]>(`/lssp/templates${query ? `?${query}` : ''}`);
}

/**
 * Get a specific template with its blocks
 */
export async function getDraftTemplate(
  templateId: string
): Promise<ApiResponse<DraftTemplateWithBlocks>> {
  return apiClient.get<DraftTemplateWithBlocks>(`/lssp/templates/${templateId}`);
}
