/**
 * Party Empty State
 * Displays when no parties exist in the graph
 */

interface PartyEmptyStateProps {
    onAddParty: () => void;
    onRegenerate: () => void;
    isRegenerating: boolean;
}

export function PartyEmptyState({
    onAddParty,
    onRegenerate,
    isRegenerating,
}: PartyEmptyStateProps) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-900">
            <div className="text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    당사자 관계도
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                    사실관계 요약에서 AI로 인물을 자동 추출하거나,
                    <br />
                    수동으로 당사자를 추가할 수 있습니다.
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onRegenerate}
                        disabled={isRegenerating}
                        className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                            isRegenerating
                                ? 'bg-gray-300 dark:bg-neutral-700 text-gray-500 cursor-not-allowed'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                    >
                        {isRegenerating ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                <span>추출 중...</span>
                            </>
                        ) : (
                            <>
                                <span>🤖</span>
                                <span>AI로 인물 추출</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={onAddParty}
                        className="px-6 py-3 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                        수동 추가
                    </button>
                </div>
            </div>
        </div>
    );
}
