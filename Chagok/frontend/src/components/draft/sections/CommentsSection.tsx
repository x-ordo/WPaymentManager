/**
 * Comments Section
 * Displays and manages draft comments with resolution tracking
 */

import { MessageSquare } from 'lucide-react';
import { DraftCommentSnapshot } from '@/services/draftStorageService';
import { formatTimestamp } from '../utils/draftFormatters';

interface CommentsSectionProps {
    comments: DraftCommentSnapshot[];
    newCommentText: string;
    onNewCommentTextChange: (text: string) => void;
    onAddComment: () => void;
    onToggleResolved: (commentId: string) => void;
}

export default function CommentsSection({
    comments,
    newCommentText,
    onNewCommentTextChange,
    onAddComment,
    onToggleResolved,
}: CommentsSectionProps) {
    return (
        <div className="rounded-lg border border-gray-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-secondary" />
                    <h4 className="text-sm font-semibold text-neutral-700 dark:text-gray-200">
                        코멘트
                    </h4>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    선택한 텍스트에 코멘트를 남길 수 있습니다.
                </span>
            </div>
            <textarea
                aria-label="코멘트 작성"
                className="w-full rounded-xl border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="선택한 부분에 대한 코멘트를 입력하세요."
                value={newCommentText}
                onChange={(event) => onNewCommentTextChange(event.target.value)}
            />
            <button
                type="button"
                onClick={onAddComment}
                className="btn-secondary text-sm px-4 py-2"
            >
                코멘트 추가
            </button>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {comments.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        아직 코멘트가 없습니다.
                    </p>
                )}
                {comments.map((comment) => (
                    <div
                        key={comment.id}
                        className="rounded-xl border border-gray-100 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-900/80 p-3 space-y-1"
                    >
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            {formatTimestamp(comment.createdAt)}
                        </p>
                        <p className="text-xs text-secondary">
                            &ldquo;{comment.quote}&rdquo;
                        </p>
                        <p className="text-sm text-neutral-700">{comment.text}</p>
                        <button
                            type="button"
                            onClick={() => onToggleResolved(comment.id)}
                            className={`text-xs font-medium ${
                                comment.resolved ? 'text-primary' : 'text-secondary'
                            }`}
                        >
                            {comment.resolved ? '해결됨' : '해결 표시'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
