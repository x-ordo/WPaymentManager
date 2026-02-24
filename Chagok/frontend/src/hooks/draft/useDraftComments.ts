import { useCallback, useState } from 'react';
import DOMPurify from 'dompurify';
import type { DraftCommentSnapshot } from '@/services/draftStorageService';
import { generateId, sanitizeDraftHtml } from '@/components/draft/utils/draftHtmlUtils';

interface UseDraftCommentsOptions {
  editorRef: React.RefObject<HTMLDivElement>;
  editorHtml: string;
  setEditorHtml: (html: string) => void;
  persistCurrentState: (
    content: string,
    history?: unknown,
    savedAt?: string | null,
    commentsOverride?: DraftCommentSnapshot[],
    changeLogOverride?: unknown
  ) => void;
  setSaveMessage: (message: string | null) => void;
}

export function useDraftComments({
  editorRef,
  editorHtml,
  setEditorHtml,
  persistCurrentState,
  setSaveMessage,
}: UseDraftCommentsOptions) {
  const [comments, setComments] = useState<DraftCommentSnapshot[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  const wrapSelectionWithSpan = useCallback((className: string, attributes: Record<string, string>) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return false;
    }
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = className;
    Object.entries(attributes).forEach(([key, value]) => span.setAttribute(key, value));
    try {
      range.surroundContents(span);
    } catch {
      const selectedHtml = selection.toString();
      if (!selectedHtml) return false;
      const safeSelection = DOMPurify.sanitize(selectedHtml, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
      document.execCommand(
        'insertHTML',
        false,
        `<span class="${className}" ${Object.entries(attributes)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')}>${safeSelection}</span>`
      );
    }
    selection.removeAllRanges();
    const html = sanitizeDraftHtml(editorRef.current?.innerHTML || editorHtml);
    setEditorHtml(html);
    persistCurrentState(html);
    return true;
  }, [editorHtml, editorRef, persistCurrentState, setEditorHtml]);

  const handleAddComment = useCallback(() => {
    const selection = window.getSelection();
    const quote = selection?.toString().trim();
    if (!quote) {
      setSaveMessage('코멘트 추가 전 텍스트를 선택하세요.');
      setTimeout(() => setSaveMessage(null), 2500);
      return;
    }
    if (!newCommentText.trim()) {
      setSaveMessage('코멘트 내용을 입력하세요.');
      setTimeout(() => setSaveMessage(null), 2500);
      return;
    }
    const comment: DraftCommentSnapshot = {
      id: generateId(),
      quote,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    wrapSelectionWithSpan('comment-highlight', { 'data-comment-id': comment.id });
    setComments((prev) => {
      const updated = [comment, ...prev];
      persistCurrentState(editorRef.current?.innerHTML || editorHtml, undefined, undefined, updated);
      return updated;
    });
    setNewCommentText('');
  }, [editorHtml, editorRef, newCommentText, persistCurrentState, setSaveMessage, wrapSelectionWithSpan]);

  const handleToggleCommentResolved = useCallback((commentId: string) => {
    setComments((prev) => {
      const updated = prev.map((comment) =>
        comment.id === commentId ? { ...comment, resolved: !comment.resolved } : comment
      );
      const editorEl = editorRef.current;
      if (editorEl) {
        const highlights = editorEl.querySelectorAll(`[data-comment-id="${commentId}"]`);
        const resolved = updated.find((comment) => comment.id === commentId)?.resolved;
        highlights.forEach((node) => {
          if (resolved) {
            node.classList.add('comment-highlight-resolved');
          } else {
            node.classList.remove('comment-highlight-resolved');
          }
        });
        const html = sanitizeDraftHtml(editorEl.innerHTML);
        setEditorHtml(html);
        persistCurrentState(html, undefined, undefined, updated);
      } else {
        persistCurrentState(editorHtml, undefined, undefined, updated);
      }
      return updated;
    });
  }, [editorHtml, editorRef, persistCurrentState, setEditorHtml]);

  return {
    comments,
    setComments,
    newCommentText,
    setNewCommentText,
    handleAddComment,
    handleToggleCommentResolved,
  };
}
