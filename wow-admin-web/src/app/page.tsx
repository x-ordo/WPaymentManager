import { getBalanceInfo, getWithdrawalLimits } from "@/actions/legacy";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [balanceRes, limitRes] = await Promise.all([
    getBalanceInfo(),
    getWithdrawalLimits(),
  ]);

  const balance = balanceRes.code === "1" ? balanceRes : null;
  const limit = limitRes.code === "1" ? limitRes : null;

  const aproValue = Number(balance?._APROVALUE || 0);
  const isAproWarning = aproValue > 0 && aproValue <= 7;
  const aproPercent = Math.min(100, Math.max(0, (aproValue / 30) * 100));

  const money = Number(balance?._MONEY || 0);
  const commIn = balance?._COMMISION_PERIN || "0";
  const commOut = Number(balance?._COMMISION_OUT || 0);
  const minSend = Number(limit?._MINSENDMONEY || 0);
  const maxSend = Number(limit?._MAXSENDMONEY || 0);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-ink-primary">종합 대시보드</h1>
        <span className="text-2xs font-medium text-ink-muted font-mono tabular-nums">
          {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
        </span>
      </div>

      {/* Hero Row — Balance + System Status */}
      <div className="flex gap-5">
        {/* Balance Hero Card */}
        <div className="flex-[3] bg-surface-card border border-border-default rounded-lg shadow-sm overflow-hidden">
          <div className="flex">
            {/* Teal accent bar */}
            <div className="w-1 bg-primary shrink-0" />
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">현재 보유 금액</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-4xl font-bold text-ink-primary font-mono tracking-tighter tabular-nums leading-none">
                  {money.toLocaleString()}
                </span>
                <span className="text-lg font-semibold text-ink-tertiary">원</span>
              </div>

              {/* Commission Summary — inline */}
              <div className="mt-6 pt-4 border-t border-border-subtle flex gap-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-ink-muted">입금 수수료</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-ink-secondary">{commIn}%</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-ink-muted">출금 수수료</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-ink-secondary">{commOut.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Days Card */}
        <div className="flex-[2] bg-surface-card border border-border-default rounded-lg shadow-sm p-5 flex flex-col">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">시스템 사용 가능일</span>

          <div className="flex-1 flex flex-col justify-center mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-4xl font-bold font-mono tracking-tighter tabular-nums leading-none ${isAproWarning ? "text-status-danger" : "text-ink-primary"}`}>
                {balance ? balance._APROVALUE : "-"}
              </span>
              <span className="text-sm font-semibold text-ink-muted">일 남음</span>
            </div>

            {/* Visual progress bar */}
            <div className="mt-4 w-full">
              <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-slow ${isAproWarning ? "bg-status-danger" : "bg-primary"}`}
                  style={{ width: `${aproPercent}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-2xs text-ink-disabled">0일</span>
                <span className="text-2xs text-ink-disabled">30일</span>
              </div>
            </div>
          </div>

          {isAproWarning && (
            <div className="mt-3 px-3 py-2 bg-status-danger-light rounded-md">
              <span className="text-xs font-semibold text-status-danger-strong">잔여일이 부족합니다. 관리자에게 문의하세요.</span>
            </div>
          )}
        </div>
      </div>

      {/* Info Grid — Limits */}
      <div className="flex gap-5">
        <div className="flex-1 bg-surface-card border border-border-default rounded-lg shadow-xs p-5">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">1회 최소 출금액</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tighter tabular-nums text-ink-primary">
              {minSend.toLocaleString()}
            </span>
            <span className="text-sm text-ink-tertiary font-medium">원</span>
          </div>
        </div>
        <div className="flex-1 bg-surface-card border border-border-default rounded-lg shadow-xs p-5">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">1회 최대 출금액</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tighter tabular-nums text-ink-primary">
              {maxSend.toLocaleString()}
            </span>
            <span className="text-sm text-ink-tertiary font-medium">원</span>
          </div>
        </div>
        <div className="flex-1 bg-surface-card border border-border-default rounded-lg shadow-xs p-5">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">입금 수수료율</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tighter tabular-nums text-ink-primary">
              {commIn}
            </span>
            <span className="text-sm text-ink-tertiary font-medium">%</span>
          </div>
        </div>
        <div className="flex-1 bg-surface-card border border-border-default rounded-lg shadow-xs p-5">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">건당 출금 수수료</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tighter tabular-nums text-ink-primary">
              {commOut.toLocaleString()}
            </span>
            <span className="text-sm text-ink-tertiary font-medium">원</span>
          </div>
        </div>
      </div>
    </div>
  );
}
