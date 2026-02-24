import { useCallback, useState } from 'react';
import DOMPurify from 'dompurify';
import type { DraftChangeLogEntry } from '@/services/draftStorageService';
import { CHANGELOG_LIMIT } from '@/components/draft/utils/draftFormatters';
import { generateId, sanitizeDraftHtml } from '@/components/draft/utils/draftHtmlUtils';

interface UseDraftChangeTrackingOptions {
  editorRef: React.RefObject<HTMLDivElement>;
  editorHtml: string;
  setEditorHtml: (html: string) => void;
  persistCurrentState: (
    content: string,
    history?: unknown,
    savedAt?: string | null,
    commentsOverride?: unknown,
    changeLogOverride?: DraftChangeLogEntry[]
  ) => void;
}

export function useDraftChangeTracking({
  editorRef,
  editorHtml,
  setEditorHtml,
  persistCurrentState,
}: UseDraftChangeTrackingOptions) {
  const [changeLog, setChangeLog] = useState<DraftChangeLogEntry[]>([]);
  const [isTrackChangesEnabled, setIsTrackChangesEnabled] = useState(false);

  const insertTrackChangeMarkup = useCallback((text: string) => {
    const safeText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    const changeId = generateId();
    document.execCommand(
      'insertHTML',
      false,
      `<span class="track-change-insert" data-change-id="${changeId}">${safeText}</span>`
    );
    const entry: DraftChangeLogEntry = {
      id: changeId,
      action: 'insert',
      snippet: safeText,
      createdAt: new Date().toISOString(),
    };
    setChangeLog((prev) => {
      const updated = [entry, ...prev].slice(0, CHANGELOG_LIMIT);
      persistCurrentState(editorRef.current?.innerHTML || editorHtml, undefined, undefined, undefined, updated);
      return updated;
    });
  }, [editorHtml, editorRef, persistCurrentState]);

  const handleBeforeInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    if (!isTrackChangesEnabled) {
      return;
    }
    const nativeEvent = event.nativeEvent as InputEvent;
    if (!nativeEvent || nativeEvent.isComposing) {
      return;
    }
    if (nativeEvent.inputType === 'insertText' && nativeEvent.data) {
      event.preventDefault();
      insertTrackChangeMarkup(nativeEvent.data);
      const html = sanitizeDraftHtml(editorRef.current?.innerHTML || editorHtml);
      setEditorHtml(html);
      persistCurrentState(html);
    }
  }, [editorHtml, editorRef, insertTrackChangeMarkup, isTrackChangesEnabled, persistCurrentState, setEditorHtml]);

  const handleEditorInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    const html = sanitizeDraftHtml((event.currentTarget as HTMLDivElement).innerHTML);
    setEditorHtml(html);

    const inputEvent = event.nativeEvent as InputEvent;
    if (isTrackChangesEnabled && inputEvent) {
      if (inputEvent.inputType === 'insertText') {
        persistCurrentState(html);
        return;
      }
      const snippet = (inputEvent.data || window.getSelection()?.toString() || '변경됨').trim() || '변경됨';
      const action: 'insert' | 'delete' | 'edit' = inputEvent.inputType?.startsWith('delete')
        ? 'delete'
        : inputEvent.inputType?.includes('format')
          ? 'edit'
          : 'insert';
      const entry: DraftChangeLogEntry = {
        id: generateId(),
        action,
        snippet,
        createdAt: new Date().toISOString(),
      };
      setChangeLog((prev) => {
        const updated = [entry, ...prev].slice(0, CHANGELOG_LIMIT);
        persistCurrentState(html, undefined, undefined, undefined, updated);
        return updated;
      });
    } else {
      persistCurrentState(html);
    }
  }, [isTrackChangesEnabled, persistCurrentState, setEditorHtml]);

  const toggleTrackChanges = useCallback(() => {
    setIsTrackChangesEnabled((prev) => !prev);
  }, []);

  return {
    changeLog,
    setChangeLog,
    isTrackChangesEnabled,
    toggleTrackChanges,
    handleBeforeInput,
    handleEditorInput,
  };
}
