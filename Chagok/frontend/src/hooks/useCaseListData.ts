import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { CaseItem, FilterState, PaginationState, SortState } from '@/hooks/useCaseList.types';

interface CaseListApiResponse {
  items: Array<{
    id: string;
    title: string;
    client_name?: string;
    status: string;
    description?: string;
    created_at: string;
    updated_at: string;
    evidence_count?: number;
    member_count?: number;
    progress?: number;
    days_since_update?: number;
    owner_name?: string;
    last_activity?: string;
  }>;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  status_counts?: Record<string, number>;
}

interface UseCaseListDataParams {
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  filters: FilterState;
  sort: SortState;
  showClosed: boolean;
}

const STALE_TIME = 30000;

function mapCaseItem(item: CaseListApiResponse['items'][number]): CaseItem {
  if (!item.id) {
    logger.warn('Case list item missing id', { item });
  }
  return {
    id: item.id,
    title: item.title,
    clientName: item.client_name,
    status: item.status,
    description: item.description,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    evidenceCount: item.evidence_count || 0,
    memberCount: item.member_count || 0,
    progress: item.progress || 0,
    daysSinceUpdate: item.days_since_update || 0,
    ownerName: item.owner_name,
    lastActivity: item.last_activity,
  };
}

export function useCaseListData({
  pagination,
  setPagination,
  filters,
  sort,
  showClosed,
}: UseCaseListDataParams) {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const hasMountedRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('page_size', pagination.pageSize.toString());
      params.append('sort_by', sort.sortBy);
      params.append('sort_order', sort.sortOrder);
      params.append('include_closed', showClosed.toString());

      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.clientName) {
        params.append('client_name', filters.clientName);
      }
      filters.status.forEach((s) => {
        params.append('status', s);
      });

      const endpoint = `/lawyer/cases?${params.toString()}`;
      const response = await apiClient.get<CaseListApiResponse>(endpoint);

      if (response.error || !response.data) {
        throw new Error(response.error || '케이스 목록을 불러오는데 실패했습니다.');
      }

      const data = response.data;
      const mappedCases = data.items.map(mapCaseItem);

      setCases(mappedCases);
      setPagination((prev) => ({
        ...prev,
        total: data.total,
        totalPages: data.total_pages,
      }));
      setStatusCounts(data.status_counts || {});
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize, setPagination, showClosed, sort.sortBy, sort.sortOrder]);

  useEffect(() => {
    if (hasMountedRef.current) {
      fetchCases();
    }
  }, [fetchCases]);

  useEffect(() => {
    hasMountedRef.current = true;
    const isStale = Date.now() - lastFetchTimeRef.current > STALE_TIME;
    if (isStale) {
      fetchCases();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    cases,
    isLoading,
    error,
    statusCounts,
    refresh: fetchCases,
    setError,
  };
}

export default useCaseListData;
