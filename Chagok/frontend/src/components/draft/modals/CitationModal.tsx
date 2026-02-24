/**
 * Citation Insert Modal
 * Displays available evidence citations for insertion into the draft
 */

import { X } from 'lucide-react';
import { DraftCitation } from '@/types/draft';

interface CitationModalProps {
    isOpen: boolean;
    citations: DraftCitation[];
    onClose: () => void;
    onInsertCitation: (citation: DraftCitation) => void;
}

export default function CitationModal({
    isOpen,
    citations,
    onClose,
    onInsertCitation,
}: CitationModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4"
            role="dialog"
            aria-label="증거 인용 삽입"
        >
            <div className="w-full max-w-md rounded-lg bg-white dark:bg-neutral-800 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        증거 인용 선택
                    </h3>
                    <button
                        type="button"
                        aria-label="증거 인용 모달 닫기"
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {citations.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            현재 인용 가능한 증거가 없습니다.
                        </p>
                    )}
                    {citations.map((citation) => (
                        <button
                            key={citation.evidenceId}
                            type="button"
                            onClick={() => onInsertCitation(citation)}
                            className="w-full rounded-xl border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 p-3 text-left hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {citation.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {citation.quote}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
