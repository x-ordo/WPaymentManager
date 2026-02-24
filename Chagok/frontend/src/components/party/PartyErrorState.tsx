/**
 * Party Error State
 * Displays when an error occurs loading the party graph
 */

interface PartyErrorStateProps {
    message: string;
    onRetry: () => void;
}

export function PartyErrorState({ message, onRetry }: PartyErrorStateProps) {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
            <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    오류가 발생했습니다
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{message}</p>
                <button
                    onClick={onRetry}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    다시 시도
                </button>
            </div>
        </div>
    );
}
