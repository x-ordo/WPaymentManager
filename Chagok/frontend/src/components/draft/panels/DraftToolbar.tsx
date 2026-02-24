import {
  Bold,
  Clock3,
  FileText,
  GitBranch,
  History,
  Italic,
  LayoutTemplate,
  List,
  Quote,
  Save,
  Underline,
  Users,
} from 'lucide-react';
import { formatAutosaveStatus } from '../utils/draftHtmlUtils';

interface DraftToolbarProps {
  onManualSave: () => void;
  isSaving: boolean;
  onOpenHistory: () => void;
  onOpenTemplate: () => void;
  onOpenCitation: () => void;
  isTrackChangesEnabled: boolean;
  onToggleTrackChanges: () => void;
  saveMessage: string | null;
  lastSavedAt: string | null;
  pageCount: number;
  collabStatus: string | null;
  onFormat: (command: string) => void;
}

export function DraftToolbar({
  onManualSave,
  isSaving,
  onOpenHistory,
  onOpenTemplate,
  onOpenCitation,
  isTrackChangesEnabled,
  onToggleTrackChanges,
  saveMessage,
  lastSavedAt,
  pageCount,
  collabStatus,
  onFormat,
}: DraftToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-900/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onManualSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-secondary dark:text-gray-200 hover:border-primary hover:text-primary transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            저장
          </button>
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-secondary dark:text-gray-200 hover:border-primary hover:text-primary transition-colors"
          >
            <History className="w-4 h-4" />
            버전 히스토리
          </button>
          <button
            type="button"
            onClick={onOpenTemplate}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-secondary dark:text-gray-200 hover:border-primary hover:text-primary transition-colors"
          >
            <LayoutTemplate className="w-4 h-4" />
            템플릿 적용
          </button>
          <button
            type="button"
            onClick={onOpenCitation}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-secondary dark:text-gray-200 hover:border-primary hover:text-primary transition-colors"
          >
            <Quote className="w-4 h-4" />
            증거 인용 삽입
          </button>
          <button
            type="button"
            onClick={onToggleTrackChanges}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              isTrackChangesEnabled
                ? 'border-primary bg-primary-light text-secondary dark:text-gray-200'
                : 'border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-secondary dark:text-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            변경 추적 {isTrackChangesEnabled ? 'ON' : 'OFF'}
          </button>
          {saveMessage && <span className="text-xs text-primary">{saveMessage}</span>}
        </div>
        <div
          className="inline-flex flex-col text-xs text-gray-500 dark:text-gray-400 items-end gap-1"
          data-testid="autosave-indicator"
        >
          <div className="inline-flex items-center">
            <Clock3 className="w-4 h-4 mr-1" />
            {formatAutosaveStatus(lastSavedAt)}
          </div>
          <span>페이지 {pageCount}</span>
          {collabStatus && (
            <span className="inline-flex items-center gap-1 text-secondary">
              <Users className="w-4 h-4" />
              {collabStatus}
            </span>
          )}
        </div>
      </div>
      <div
        data-testid="draft-toolbar-panel"
        className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 tracking-wide"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-secondary" />
          <div className="h-4 w-px bg-gray-300 dark:bg-neutral-600 mx-2" />
          <button
            type="button"
            aria-label="Bold"
            onClick={() => onFormat('bold')}
            className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
          >
            <Bold className="w-4 h-4 text-neutral-700" />
          </button>
          <button
            type="button"
            aria-label="Italic"
            onClick={() => onFormat('italic')}
            className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
          >
            <Italic className="w-4 h-4 text-neutral-700" />
          </button>
          <button
            type="button"
            aria-label="Underline"
            onClick={() => onFormat('underline')}
            className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
          >
            <Underline className="w-4 h-4 text-neutral-700" />
          </button>
          <div className="h-4 w-px bg-gray-300 dark:bg-neutral-600 mx-2" />
          <button
            type="button"
            aria-label="List"
            onClick={() => onFormat('insertUnorderedList')}
            className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
          >
            <List className="w-4 h-4 text-neutral-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
