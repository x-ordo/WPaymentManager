'use client';

/**
 * useCaseList Hook
 * 003-role-based-ui Feature - US3
 *
 * Hook for managing case list state, filtering, and bulk actions.
 */

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { useCaseListData } from '@/hooks/useCaseListData';
import type {
  BulkActionResult,
  CaseItem,
  FilterState,
  PaginationState,
  SortState,
} from '@/hooks/useCaseList.types';

interface BulkActionApiResult {
  case_id: string;
  success: boolean;
  message?: string;
  error?: string;
}

interface BulkActionApiResponse {
  results: BulkActionApiResult[];
  failed: number;
  successful: number;
  total_requested: number;
}

interface UseCaseListReturn {
  // Data
  cases: CaseItem[];
  isLoading: boolean;
  error: string | null;

  // Pagination
  pagination: PaginationState;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Filtering
  filters: FilterState;
  statusCounts: Record<string, number>;
  setFilters: (filters: FilterState) => void;
  resetFilters: () => void;

  // Sorting
  sort: SortState;
  setSort: (field: string) => void;

  // Selection
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;

  // Tab (active/closed)
  showClosed: boolean;
  setShowClosed: (show: boolean) => void;

  // Actions
  refresh: () => void;
  executeBulkAction: (action: string, params?: Record<string, string>) => Promise<BulkActionResult[]>;
  isBulkActionLoading: boolean;
  permanentDeleteCase: (caseId: string) => Promise<boolean>;
}

const defaultFilters: FilterState = {
  search: '',
  status: [],
  clientName: '',
};

const defaultPagination: PaginationState = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
};

const defaultSort: SortState = {
  sortBy: 'updated_at',
  sortOrder: 'desc',
};

export function useCaseList(): UseCaseListReturn {
  const [pagination, setPagination] = useState<PaginationState>(defaultPagination);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sort, setSortState] = useState<SortState>(defaultSort);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [showClosed, setShowClosedState] = useState(false);

  const {
    cases,
    isLoading,
    error,
    statusCounts,
    refresh,
    setError,
  } = useCaseListData({
    pagination,
    setPagination,
    filters,
    sort,
    showClosed,
  });

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    setSelectedIds([]);
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }));
    setSelectedIds([]);
  }, []);

  const updateFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedIds([]);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedIds([]);
  }, []);

  const setSort = useCallback((field: string) => {
    setSortState((prev) => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
    setSelectedIds([]);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const setShowClosed = useCallback((show: boolean) => {
    setShowClosedState(show);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedIds([]);
  }, []);

  const permanentDeleteCase = useCallback(async (caseId: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await apiClient.delete(`/cases/${caseId}?permanent=true`);

      if (response.error) {
        throw new Error(response.error || '삭제에 실패했습니다.');
      }

      await refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
      return false;
    }
  }, [refresh, setError]);

  const executeBulkAction = useCallback(
    async (action: string, params?: Record<string, string>): Promise<BulkActionResult[]> => {
      if (selectedIds.length === 0) return [];

      setIsBulkActionLoading(true);
      setError(null);

      try {
        const response = await apiClient.post<BulkActionApiResponse>('/lawyer/cases/bulk-action', {
          case_ids: selectedIds,
          action,
          params,
        });

        if (response.error || !response.data) {
          throw new Error(response.error || '작업 실행에 실패했습니다.');
        }

        const data = response.data;

        await refresh();
        setSelectedIds([]);

        return data.results.map((r: BulkActionApiResult): BulkActionResult => ({
          caseId: r.case_id,
          success: r.success,
          message: r.message,
          error: r.error,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
        return [];
      } finally {
        setIsBulkActionLoading(false);
      }
    },
    [refresh, selectedIds, setError]
  );

  return {
    cases,
    isLoading,
    error,
    pagination,
    setPage,
    setPageSize,
    filters,
    statusCounts,
    setFilters: updateFilters,
    resetFilters,
    sort,
    setSort,
    selectedIds,
    setSelectedIds,
    clearSelection,
    showClosed,
    setShowClosed,
    refresh,
    executeBulkAction,
    isBulkActionLoading,
    permanentDeleteCase,
  };
}

export default useCaseList;
