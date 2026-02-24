interface PartyGraphToolbarProps {
  onAddParty: () => void;
  onOpenEvidenceLinkModal: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  autoExtractedCount: number;
}

export function PartyGraphToolbar({
  onAddParty,
  onOpenEvidenceLinkModal,
  onRegenerate,
  isRegenerating,
  autoExtractedCount,
}: PartyGraphToolbarProps) {
  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
      <button
        onClick={onAddParty}
        className="px-4 py-2 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 rounded-lg shadow dark:shadow-neutral-900/50 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-sm font-medium"
      >
        + 당사자 추가
      </button>
      <button
        onClick={onOpenEvidenceLinkModal}
        className="px-4 py-2 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 rounded-lg shadow dark:shadow-neutral-900/50 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-sm font-medium"
      >
        📎 증거 연결
      </button>
      <button
        onClick={onRegenerate}
        disabled={isRegenerating}
        className={`px-4 py-2 rounded-lg shadow dark:shadow-neutral-900/50 text-sm font-medium flex items-center gap-1.5 transition-colors ${
          isRegenerating
            ? 'bg-gray-100 dark:bg-neutral-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {isRegenerating ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>재생성 중...</span>
          </>
        ) : (
          <>
            <span>🤖</span>
            <span>AI 재생성</span>
          </>
        )}
      </button>
      {autoExtractedCount > 0 && (
        <div className="px-3 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg shadow dark:shadow-neutral-900/50 text-sm font-medium flex items-center gap-1.5">
          <span>AI 추출 {autoExtractedCount}명</span>
        </div>
      )}
    </div>
  );
}
