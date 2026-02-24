export interface CaseItem {
  id: string;
  title: string;
  clientName?: string;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  evidenceCount: number;
  memberCount: number;
  progress: number;
  daysSinceUpdate: number;
  ownerName?: string;
  lastActivity?: string;
}

export interface FilterState {
  search: string;
  status: string[];
  clientName: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SortState {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface BulkActionResult {
  caseId: string;
  success: boolean;
  message?: string;
  error?: string;
}
