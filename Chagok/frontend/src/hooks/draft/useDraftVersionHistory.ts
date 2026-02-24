import { useCallback, useEffect, useState } from 'react';
import type { DraftSaveReason, DraftVersionSnapshot } from '@/services/draftStorageService';
import { generateId, sanitizeDraftHtml, stripHtml } from '@/components/draft/utils/draftHtmlUtils';

interface UseDraftVersionHistoryOptions {
  editorHtml: string;
  setEditorHtml: (html: string) => void;
  persistCurrentState: (
    content: string,
    history?: DraftVersionSnapshot[],
    savedAt?: string | null,
    commentsOverride?: unknown,
    changeLogOverride?: unknown
  ) => void;
  historyLimit: number;
  autosaveIntervalMs: number;
  setSaveMessage: (message: string | null) => void;
}

export function useDraftVersionHistory({
  editorHtml,
  setEditorHtml,
  persistCurrentState,
  historyLimit,
  autosaveIntervalMs,
  setSaveMessage,
}: UseDraftVersionHistoryOptions) {
  const [versionHistory, setVersionHistory] = useState<DraftVersionSnapshot[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const recordVersion = useCallback(
    (reason: DraftSaveReason, overrideContent?: string) => {
      const contentToSave = sanitizeDraftHtml(overrideContent ?? editorHtml);
      if (!contentToSave || !stripHtml(contentToSave)) {
        return;
      }

      const version: DraftVersionSnapshot = {
        id: generateId(),
        content: contentToSave,
        savedAt: new Date().toISOString(),
        reason,
      };

      setVersionHistory((prev) => {
        const filtered = prev.filter((entry) => entry.content !== contentToSave);
        const updated = [version, ...filtered].slice(0, historyLimit);
        persistCurrentState(contentToSave, updated, version.savedAt);
        return updated;
      });
      setLastSavedAt(version.savedAt);

      if (reason === 'manual') {
        setSaveMessage('수동 저장 완료');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    },
    [editorHtml, historyLimit, persistCurrentState, setSaveMessage]
  );

  const restoreVersion = useCallback(
    (versionId: string) => {
      const targetVersion = versionHistory.find((version) => version.id === versionId);
      if (!targetVersion) return false;
      setEditorHtml(targetVersion.content);
      persistCurrentState(targetVersion.content);
      return true;
    },
    [persistCurrentState, setEditorHtml, versionHistory]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      recordVersion('auto');
    }, autosaveIntervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [autosaveIntervalMs, recordVersion]);

  return {
    versionHistory,
    setVersionHistory,
    lastSavedAt,
    setLastSavedAt,
    recordVersion,
    restoreVersion,
  };
}
