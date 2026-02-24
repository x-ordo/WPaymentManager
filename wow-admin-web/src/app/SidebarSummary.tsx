import { getBalanceInfo } from "@/actions/legacy";

export async function SidebarSummary() {
  const balanceRes = await getBalanceInfo();
  const balance = balanceRes.code === "1" ? balanceRes : null;

  const aproValue = Number(balance?._APROVALUE || 0);
  const isAproWarning = aproValue > 0 && aproValue <= 7;

  return (
    <div className="p-4 border-t border-border-default bg-surface-muted space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs font-medium text-ink-muted">보유금액</span>
          <span className="text-base font-bold text-ink-primary font-mono tracking-tighter tabular-nums">
            {Number(balance?._MONEY || 0).toLocaleString()}<span className="text-2xs text-ink-tertiary ml-0.5">원</span>
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs font-medium text-ink-muted">사용가능일</span>
          <span className={`text-base font-bold font-mono tracking-tighter tabular-nums ${isAproWarning ? "text-status-danger" : "text-primary-text"}`}>
            {balance?._APROVALUE || "-"}<span className="text-2xs text-ink-tertiary ml-0.5">일</span>
          </span>
        </div>
      </div>
      <div className="pt-2.5 border-t border-border-subtle space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-ink-muted">입금 수수료</span>
          <span className="font-mono font-semibold text-ink-secondary tabular-nums">{balance?._COMMISION_PERIN || "0"}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-muted">출금 수수료</span>
          <span className="font-mono font-semibold text-ink-secondary tabular-nums">{Number(balance?._COMMISION_OUT || 0).toLocaleString()}원</span>
        </div>
      </div>
    </div>
  );
}

export function SidebarSummarySkeleton() {
  return (
    <div className="p-4 border-t border-border-default bg-surface-muted space-y-3 animate-pulse">
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <div className="h-3 w-14 bg-border-subtle rounded" />
          <div className="h-5 w-24 bg-border-subtle rounded" />
        </div>
        <div className="flex justify-between items-baseline">
          <div className="h-3 w-16 bg-border-subtle rounded" />
          <div className="h-5 w-12 bg-border-subtle rounded" />
        </div>
      </div>
      <div className="pt-2.5 border-t border-border-subtle space-y-1">
        <div className="flex justify-between">
          <div className="h-3 w-16 bg-border-subtle rounded" />
          <div className="h-3 w-10 bg-border-subtle rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-16 bg-border-subtle rounded" />
          <div className="h-3 w-14 bg-border-subtle rounded" />
        </div>
      </div>
    </div>
  );
}
