/**
 * Change Log Section
 * Displays tracked changes in the draft document
 */

import { GitBranch } from 'lucide-react';
import { DraftChangeLogEntry } from '@/services/draftStorageService';
import { formatTimestamp } from '../utils/draftFormatters';

interface ChangeLogSectionProps {
    changeLog: DraftChangeLogEntry[];
}

export default function ChangeLogSection({ changeLog }: ChangeLogSectionProps) {
    return (
        <div className="rounded-lg border border-gray-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-3">
            <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-secondary" />
                <h4 className="text-sm font-semibold text-neutral-700 dark:text-gray-200">
                    변경 추적
                </h4>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {changeLog.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        기록된 변경 사항이 없습니다.
                    </p>
                )}
                {changeLog.map((entry) => (
                    <div
                        key={entry.id}
                        className="rounded-xl border border-gray-100 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-900/80 p-3"
                    >
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            {formatTimestamp(entry.createdAt)}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {entry.action.toUpperCase()}
                        </p>
                        <p className="text-sm text-neutral-700 truncate">{entry.snippet}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
