/**
 * Save Status Indicator
 * Displays the current save status for the party graph
 */

import type { SaveStatus } from '@/hooks/usePartyGraph';

interface SaveStatusIndicatorProps {
    status: SaveStatus;
}

const statusConfig = {
    idle: { text: '', className: '' },
    saving: { text: '저장 중...', className: 'text-gray-500 dark:text-gray-400' },
    saved: { text: '저장됨 ✓', className: 'text-green-600 dark:text-green-400' },
    error: { text: '저장 실패 ⚠️', className: 'text-red-600 dark:text-red-400' },
};

export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
    const config = statusConfig[status];
    if (!config.text) return null;

    return (
        <div
            className={`absolute top-4 right-4 px-3 py-1 bg-white dark:bg-neutral-800 rounded-full shadow dark:shadow-neutral-900/50 text-sm ${config.className}`}
        >
            {config.text}
        </div>
    );
}
