"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Page Error]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-surface-card border border-border-default rounded-lg p-8 text-center max-w-md shadow-sm">
        <div className="w-10 h-10 rounded-full bg-status-danger-light flex items-center justify-center mx-auto mb-4">
          <span className="text-status-danger font-bold text-lg">!</span>
        </div>
        <h2 className="text-lg font-bold text-ink-primary mb-2">오류가 발생했습니다</h2>
        <p className="text-sm text-ink-muted mb-6">
          {error.message || "페이지를 로드할 수 없습니다. 잠시 후 다시 시도해 주세요."}
        </p>
        <button
          onClick={reset}
          className="bg-btn-primary-bg text-btn-primary-text px-6 py-2 rounded-md text-sm font-semibold hover:bg-btn-primary-hover transition-colors duration-fast"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
