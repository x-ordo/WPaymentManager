/**
 * Party Loading State
 * Displays while the party graph is loading
 */

export function PartyLoadingState() {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">관계도를 불러오는 중...</p>
            </div>
        </div>
    );
}
