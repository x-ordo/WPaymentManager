/**
 * API client for Assets
 * 009-calm-control-design-system
 */

import { apiClient, buildApiUrl } from './client';
import type {
  LegacyAsset as Asset,
  CreateAssetRequest,
  LegacyDivisionSummary as DivisionSummary,
  SimulateDivisionRequest,
} from '@/types/asset';

// Get all assets for a case
export async function getAssets(caseId: string): Promise<Asset[]> {
  const response = await apiClient.get<any>(`/cases/${caseId}/assets`);
  const data = response.data;
  
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.assets)) return data.assets;
  if (data && Array.isArray(data.data)) return data.data;
  
  return [];
}

// Get single asset
export async function getAsset(caseId: string, assetId: string): Promise<Asset> {
  const response = await apiClient.get<Asset>(`/cases/${caseId}/assets/${assetId}`);
  if (!response.data) throw new Error('Asset not found');
  return response.data;
}

// Create new asset
export async function createAsset(caseId: string, data: CreateAssetRequest): Promise<Asset> {
  const response = await apiClient.post<Asset>(`/cases/${caseId}/assets`, data);
  if (!response.data) throw new Error('Failed to create asset');
  return response.data;
}

// Update asset
export async function updateAsset(
  caseId: string,
  assetId: string,
  data: Partial<CreateAssetRequest>
): Promise<Asset> {
  const response = await apiClient.put<Asset>(`/cases/${caseId}/assets/${assetId}`, data);
  if (!response.data) throw new Error('Failed to update asset');
  return response.data;
}

// Delete asset
export async function deleteAsset(caseId: string, assetId: string): Promise<void> {
  await apiClient.delete(`/cases/${caseId}/assets/${assetId}`);
}

// Get division summary
export async function getDivisionSummary(caseId: string): Promise<DivisionSummary> {
  const response = await apiClient.get<DivisionSummary>(`/cases/${caseId}/assets/summary`);
  if (!response.data) throw new Error('Division summary not found');
  return response.data;
}

// Simulate division with custom ratios
export async function simulateDivision(
  caseId: string,
  data: SimulateDivisionRequest
): Promise<DivisionSummary> {
  const response = await apiClient.post<DivisionSummary>(
    `/cases/${caseId}/assets/simulate-division`,
    data
  );
  if (!response.data) throw new Error('Failed to simulate division');
  return response.data;
}

export async function exportAssetsCsv(
  caseId: string
): Promise<{ blob: Blob; filename: string }> {
  const url = buildApiUrl(`/cases/${caseId}/assets/export`);
  const response = await fetch(url, { method: 'GET', credentials: 'include' });

  if (!response.ok) {
    throw new Error('Failed to export assets');
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition') ?? '';
  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  const filename = filenameMatch?.[1] ?? `assets_${caseId}.csv`;

  return { blob, filename };
}
