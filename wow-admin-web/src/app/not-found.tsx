import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-6xl font-bold font-mono tabular-nums text-ink-disabled mb-4">404</div>
        <h2 className="text-lg font-bold text-ink-primary mb-2">페이지를 찾을 수 없습니다</h2>
        <p className="text-sm text-ink-muted mb-6">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
        <Link
          href="/"
          className="bg-btn-primary-bg text-btn-primary-text px-6 py-2 rounded-md text-sm font-semibold hover:bg-btn-primary-hover transition-colors duration-fast"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}
