import { useDraftChangeTracking } from './useDraftChangeTracking';
import { useDraftComments } from './useDraftComments';
import { useDraftCollaboration } from './useDraftCollaboration';
import type { DraftChangeLogEntry, DraftCommentSnapshot } from '@/services/draftStorageService';

interface UseDraftEditorOptions {
  caseId: string;
  editorHtml: string;
  setEditorHtml: (html: string) => void;
  editorRef: React.RefObject<HTMLDivElement>;
  persistCurrentState: (
    content: string,
    history?: unknown,
    savedAt?: string | null,
    commentsOverride?: DraftCommentSnapshot[],
    changeLogOverride?: DraftChangeLogEntry[]
  ) => void;
  setSaveMessage: (message: string | null) => void;
  lastImportedDraftRef: React.MutableRefObject<string | null>;
}

export function useDraftEditor({
  caseId,
  editorHtml,
  setEditorHtml,
  editorRef,
  persistCurrentState,
  setSaveMessage,
  lastImportedDraftRef,
}: UseDraftEditorOptions) {
  const {
    changeLog,
    setChangeLog,
    isTrackChangesEnabled,
    toggleTrackChanges,
    handleBeforeInput,
    handleEditorInput,
  } = useDraftChangeTracking({
    editorRef,
    editorHtml,
    setEditorHtml,
    persistCurrentState,
  });

  const {
    comments,
    setComments,
    newCommentText,
    setNewCommentText,
    handleAddComment,
    handleToggleCommentResolved,
  } = useDraftComments({
    editorRef,
    editorHtml,
    setEditorHtml,
    persistCurrentState,
    setSaveMessage,
  });

  const { collabStatus, broadcastSave } = useDraftCollaboration({
    caseId,
    editorHtml,
    comments,
    changeLog,
    setEditorHtml,
    setComments,
    setChangeLog,
    persistCurrentState,
    lastImportedDraftRef,
  });

  return {
    changeLog,
    setChangeLog,
    isTrackChangesEnabled,
    toggleTrackChanges,
    handleBeforeInput,
    handleEditorInput,
    comments,
    setComments,
    newCommentText,
    setNewCommentText,
    handleAddComment,
    handleToggleCommentResolved,
    collabStatus,
    broadcastSave,
  };
}
