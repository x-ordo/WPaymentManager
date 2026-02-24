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
      <div className="card card-border bg-base-100 max-w-md">
        <div className="card-body items-center text-center">
          <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center mb-2">
            <span className="text-error font-bold text-lg">!</span>
          </div>
          <h2 className="card-title">오류가 발생했습니다</h2>
          <p className="text-sm text-base-content/50">
            {error.message || "페이지를 로드할 수 없습니다. 잠시 후 다시 시도해 주세요."}
          </p>
          <div className="card-actions mt-4">
            <button onClick={reset} className="btn btn-primary btn-sm">다시 시도</button>
          </div>
        </div>
      </div>
    </div>
  );
}
