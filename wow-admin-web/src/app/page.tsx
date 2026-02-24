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
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">종합 대시보드</h1>
        <span className="text-sm font-medium text-base-content/40 font-mono tabular-nums">
          {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
        </span>
      </div>

      {/* Hero Row — Balance + System Status */}
      <div className="flex gap-6">
        {/* Balance Hero Card */}
        <div className="card card-border flex-[3] bg-base-100">
          <div className="flex">
            <div className="w-1.5 bg-primary shrink-0 rounded-l-[var(--radius-box)]" />
            <div className="card-body p-6">
              <div className="flex items-center gap-2">
                <h2 className="card-title text-sm font-semibold text-base-content/50 uppercase tracking-wide">현재 보유 금액</h2>
                <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-5xl font-bold font-mono tracking-tighter tabular-nums leading-none">
                  {money.toLocaleString()}
                </span>
                <span className="text-xl font-semibold text-base-content/40">원</span>
              </div>

              <div className="divider my-3"></div>
              <div className="flex gap-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-base-content/50">입금 수수료</span>
                  <span className="text-base font-bold font-mono tabular-nums">{commIn}%</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-base-content/50">출금 수수료</span>
                  <span className="text-base font-bold font-mono tabular-nums">{commOut.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Days Card */}
        <div className="card card-border flex-[2] bg-base-100">
          <div className="card-body p-6 flex flex-col">
            <h2 className="card-title text-sm font-semibold text-base-content/50 uppercase tracking-wide">시스템 사용 가능일</h2>

            <div className="flex-1 flex flex-col justify-center mt-4">
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold font-mono tracking-tighter tabular-nums leading-none ${isAproWarning ? "text-error" : ""}`}>
                  {balance ? balance._APROVALUE : "-"}
                </span>
                <span className="text-base font-semibold text-base-content/50">일 남음</span>
              </div>

              <div className="mt-5 w-full">
                <progress
                  className={`progress w-full h-2.5 ${isAproWarning ? "progress-error" : "progress-primary"}`}
                  value={aproPercent}
                  max="100"
                ></progress>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-base-content/30">0일</span>
                  <span className="text-xs text-base-content/30">30일</span>
                </div>
              </div>
            </div>

            {isAproWarning && (
              <div role="alert" className="alert alert-error alert-soft mt-4 py-3 px-4">
                <span className="text-sm font-semibold">잔여일이 부족합니다. 관리자에게 문의하세요.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Grid — Limits */}
      <div className="stats stats-horizontal shadow w-full">
        <div className="stat py-5">
          <div className="stat-title text-sm">1회 최소 출금액</div>
          <div className="stat-value text-3xl font-mono tabular-nums">{minSend.toLocaleString()}<span className="text-base text-base-content/40 font-medium ml-1">원</span></div>
        </div>
        <div className="stat py-5">
          <div className="stat-title text-sm">1회 최대 출금액</div>
          <div className="stat-value text-3xl font-mono tabular-nums">{maxSend.toLocaleString()}<span className="text-base text-base-content/40 font-medium ml-1">원</span></div>
        </div>
        <div className="stat py-5">
          <div className="stat-title text-sm">입금 수수료율</div>
          <div className="stat-value text-3xl font-mono tabular-nums">{commIn}<span className="text-base text-base-content/40 font-medium ml-1">%</span></div>
        </div>
        <div className="stat py-5">
          <div className="stat-title text-sm">건당 출금 수수료</div>
          <div className="stat-value text-3xl font-mono tabular-nums">{commOut.toLocaleString()}<span className="text-base text-base-content/40 font-medium ml-1">원</span></div>
        </div>
      </div>
    </div>
  );
}
