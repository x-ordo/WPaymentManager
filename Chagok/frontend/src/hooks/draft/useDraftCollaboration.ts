import { useCallback, useEffect, useRef, useState } from 'react';
import type { DraftChangeLogEntry, DraftCommentSnapshot } from '@/services/draftStorageService';
import { generateId, sanitizeDraftHtml } from '@/components/draft/utils/draftHtmlUtils';

interface UseDraftCollaborationOptions {
  caseId: string;
  editorHtml: string;
  comments: DraftCommentSnapshot[];
  changeLog: DraftChangeLogEntry[];
  setEditorHtml: (html: string) => void;
  setComments: (comments: DraftCommentSnapshot[]) => void;
  setChangeLog: (entries: DraftChangeLogEntry[]) => void;
  persistCurrentState: (
    content: string,
    history?: unknown,
    savedAt?: string | null,
    commentsOverride?: DraftCommentSnapshot[],
    changeLogOverride?: DraftChangeLogEntry[]
  ) => void;
  lastImportedDraftRef?: React.MutableRefObject<string | null>;
}

export function useDraftCollaboration({
  caseId,
  editorHtml,
  comments,
  changeLog,
  setEditorHtml,
  setComments,
  setChangeLog,
  persistCurrentState,
  lastImportedDraftRef,
}: UseDraftCollaborationOptions) {
  const [collabStatus, setCollabStatus] = useState<string | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const clientIdRef = useRef<string>(generateId());
  const lastRemoteUpdateRef = useRef<number>(0);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(`leh-draft-collab-${caseId}`);
    channelRef.current = channel;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as {
        type: string;
        caseId: string;
        clientId: string;
        savedAt?: string;
        html?: string;
        comments?: DraftCommentSnapshot[];
        changeLog?: DraftChangeLogEntry[];
        timestamp?: number;
      };
      if (!data || data.caseId !== caseId || data.clientId === clientIdRef.current) {
        return;
      }
      if (data.type === 'presence') {
        setCollabStatus('다른 사용자가 편집 중');
      }
      if (data.type === 'save') {
        setCollabStatus('동료가 방금 저장했습니다');
        setTimeout(() => setCollabStatus(null), 4000);
      }
      if (data.type === 'content-update' && data.timestamp) {
        if (data.timestamp <= lastRemoteUpdateRef.current) {
          return;
        }
        lastRemoteUpdateRef.current = data.timestamp;
        const sanitized = sanitizeDraftHtml(data.html || '');
        setEditorHtml(sanitized);
        setComments(data.comments || []);
        setChangeLog(data.changeLog || []);
        persistCurrentState(sanitized, undefined, undefined, data.comments || [], data.changeLog || []);
        if (lastImportedDraftRef) {
          lastImportedDraftRef.current = sanitized;
        }
        setCollabStatus('동료가 편집 내용을 동기화했습니다.');
        setTimeout(() => setCollabStatus(null), 4000);
      }
    };

    channel.addEventListener('message', handleMessage);
    channel.postMessage({ type: 'presence', caseId, clientId: clientIdRef.current });
    const presenceInterval = window.setInterval(() => {
      channel.postMessage({ type: 'presence', caseId, clientId: clientIdRef.current });
    }, 15000);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
      window.clearInterval(presenceInterval);
    };
  }, [caseId, lastImportedDraftRef, persistCurrentState, setChangeLog, setComments, setEditorHtml]);

  useEffect(() => {
    if (!channelRef.current) {
      return;
    }

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = window.setTimeout(() => {
      channelRef.current?.postMessage({
        type: 'content-update',
        caseId,
        clientId: clientIdRef.current,
        html: editorHtml,
        comments,
        changeLog,
        timestamp: Date.now(),
      });
    }, 500);

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [caseId, changeLog, comments, editorHtml]);

  const broadcastSave = useCallback((savedAt: string) => {
    channelRef.current?.postMessage({
      type: 'save',
      caseId,
      clientId: clientIdRef.current,
      savedAt,
    });
  }, [caseId]);

  return {
    collabStatus,
    broadcastSave,
  };
}
