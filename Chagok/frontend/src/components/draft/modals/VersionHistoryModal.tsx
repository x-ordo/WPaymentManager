/**
 * Version History Modal
 * Displays saved draft versions with restore capability
 */

import { X } from 'lucide-react';
import { DraftVersionSnapshot } from '@/services/draftStorageService';
import { formatVersionReason, formatTimestamp, HISTORY_LIMIT } from '../utils/draftFormatters';

interface VersionHistoryModalProps {
    isOpen: boolean;
    versionHistory: DraftVersionSnapshot[];
    onClose: () => void;
    onRestore: (versionId: string) => void;
}

export default function VersionHistoryModal({
    isOpen,
    versionHistory,
    onClose,
    onRestore,
}: VersionHistoryModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 px-4 pb-6 sm:items-center"
            role="dialog"
            aria-label="버전 히스토리 패널"
        >
            <div
                className="w-full max-w-md rounded-lg bg-white dark:bg-neutral-800 p-6 shadow-2xl"
                data-testid="version-history-panel"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            버전 히스토리
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            최대 {HISTORY_LIMIT}개의 버전이 보관됩니다.
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="버전 히스토리 닫기"
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {versionHistory.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            저장된 버전이 없습니다.
                        </p>
                    )}
                    {versionHistory.map((version) => (
                        <button
                            key={version.id}
                            type="button"
                            onClick={() => onRestore(version.id)}
                            className="w-full rounded-xl border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 p-3 text-left hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {formatVersionReason(version.reason)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTimestamp(version.savedAt)}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
