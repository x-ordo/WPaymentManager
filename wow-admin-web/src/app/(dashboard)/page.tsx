import {
  getBalanceInfo,
  getWithdrawalLimits,
  getWithdrawalList,
  getDepositApplications
} from "@/actions/legacy";
import { getKSTDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sdate = getKSTDate(0, 'start');
  const edate = getKSTDate(0, 'end');

  const [balanceRes, limitRes, withdrawRes, depositRes] = await Promise.all([
    getBalanceInfo(),
    getWithdrawalLimits(),
    getWithdrawalList(sdate, edate),
    getDepositApplications(sdate, edate),
  ]);

  const balance = balanceRes.success ? balanceRes.data : null;
  const limit = limitRes.success ? limitRes.data : null;

  const todayWithdraws = withdrawRes.data || [];
  const todayDeposits = depositRes.data || [];

  const totalWithdrawAmt = todayWithdraws.reduce((acc: number, cur: any) => acc + Number(cur._MONEY || 0), 0);
  const totalDepositAmt = todayDeposits.reduce((acc: number, cur: any) => acc + Number(cur._ORDERAMT || 0), 0);
  const netFlow = totalDepositAmt - totalWithdrawAmt;

  const withdrawCount = todayWithdraws.length;
  const depositCount = todayDeposits.length;

  const money = Number(balance?._MONEY || 0);
  const commIn = balance?._COMMISION_PERIN || "0";
  const commOut = Number(balance?._COMMISION_OUT || 0);
  const minSend = Number(limit?._MINSENDMONEY || 0);
  const maxSend = Number(limit?._MAXSENDMONEY || 0);

  const aproValue = Number(balance?._APROVALUE || 0);
  const isAproWarning = aproValue > 0 && aproValue <= 7;
  const aproPercent = Math.min(100, Math.max(0, (aproValue / 30) * 100));
  const aproDeg = Math.round((aproPercent / 100) * 360);

  // max 기준 활동 비율 (시각화용)
  const maxActivity = Math.max(totalDepositAmt, totalWithdrawAmt, 1);
  const depositBar = Math.max(8, (totalDepositAmt / maxActivity) * 100);
  const withdrawBar = Math.max(8, (totalWithdrawAmt / maxActivity) * 100);

  return (
    <div className="space-y-3 pb-6">
      {/* ─── Header Strip ─── */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-base-content">종합 대시보드</h1>
        <p className="text-sm font-medium text-base-content/50 uppercase tracking-widest mt-0.5">Asset & Transaction Overview</p>
      </div>

      {/* ─── Row 1: Balance Hero + Service Period ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Balance Card — 3 columns */}
        <div className="lg:col-span-3 card bg-primary text-primary-content shadow-lg border-none overflow-hidden relative">
          {/* 기하학적 패턴 오버레이 */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, white 40px, white 41px)`,
          }} />

          <div className="card-body p-6 lg:p-8 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              {/* 잔액 */}
              <div className="flex-1">
                <div className="text-sm font-medium text-primary-content/60 uppercase tracking-widest mb-3">Total Balance</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl lg:text-7xl font-black tabular-nums tracking-tighter leading-none">
                    {money.toLocaleString()}
                  </span>
                  <span className="text-lg font-normal text-primary-content/50">KRW</span>
                </div>
              </div>

              {/* 수수료 인라인 */}
              <div className="flex gap-3 lg:pb-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10 min-w-24 text-center">
                  <div className="text-sm font-medium text-primary-content/60 uppercase tracking-wider mb-1">입금</div>
                  <div className="text-lg font-black tabular-nums leading-none">{commIn}%</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10 min-w-24 text-center">
                  <div className="text-sm font-medium text-primary-content/60 uppercase tracking-wider mb-1">출금</div>
                  <div className="text-lg font-black tabular-nums leading-none">{commOut.toLocaleString()}<span className="text-sm font-normal ml-0.5">원</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Period Card — 1 column */}
        <div className="card card-border bg-base-100 shadow-sm border-base-300">
          <div className="card-body p-5 flex flex-col items-center justify-center gap-3">
            <div className="text-sm font-medium text-base-content/50 uppercase tracking-widest">서비스 잔여</div>

            {/* CSS-only 원형 프로그레스 */}
            <div className="relative w-28 h-28">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(${isAproWarning ? 'oklch(58% 0.22 27)' : 'oklch(42% 0.1 170)'} ${aproDeg}deg, oklch(91% 0.01 250) ${aproDeg}deg)`,
                }}
              />
              <div className="absolute inset-2 rounded-full bg-base-100 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black tabular-nums leading-none ${isAproWarning ? "text-error" : "text-primary"}`}>
                  {balance ? balance._APROVALUE ?? "-" : "-"}
                </span>
                <span className="text-sm font-normal text-base-content/50 mt-0.5">일 남음</span>
              </div>
            </div>

            {isAproWarning && (
              <span className="badge badge-error badge-soft badge-sm font-bold text-sm">갱신 필요</span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Row 2: Today's Activity — 3 metric cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* 입금 */}
        <div className="card card-border bg-base-100 shadow-sm border-base-300 overflow-hidden">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-base-content/60 uppercase tracking-widest">Today 입금</span>
              <span className="badge badge-info badge-soft badge-sm font-bold tabular-nums">{depositCount}건</span>
            </div>
            <div className="text-2xl font-black tabular-nums tracking-tight text-info leading-none">
              +{totalDepositAmt.toLocaleString()}
              <span className="text-sm font-normal text-base-content/40 ml-1">원</span>
            </div>
            {/* 미니 바 */}
            <div className="mt-3 h-1.5 bg-base-200 rounded-full overflow-hidden">
              <div className="h-full bg-info/50 rounded-full transition-all" style={{ width: `${depositBar}%` }} />
            </div>
          </div>
        </div>

        {/* 출금 */}
        <div className="card card-border bg-base-100 shadow-sm border-base-300 overflow-hidden">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-base-content/60 uppercase tracking-widest">Today 출금</span>
              <span className="badge badge-warning badge-soft badge-sm font-bold tabular-nums">{withdrawCount}건</span>
            </div>
            <div className="text-2xl font-black tabular-nums tracking-tight text-warning leading-none">
              -{totalWithdrawAmt.toLocaleString()}
              <span className="text-sm font-normal text-base-content/40 ml-1">원</span>
            </div>
            <div className="mt-3 h-1.5 bg-base-200 rounded-full overflow-hidden">
              <div className="h-full bg-warning/50 rounded-full transition-all" style={{ width: `${withdrawBar}%` }} />
            </div>
          </div>
        </div>

        {/* 순유입 */}
        <div className="card card-border bg-base-100 shadow-sm border-base-300 overflow-hidden">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-base-content/60 uppercase tracking-widest">순유입</span>
              <span className={`badge badge-sm font-bold ${netFlow >= 0 ? "badge-success badge-soft" : "badge-error badge-soft"}`}>
                {netFlow >= 0 ? "흑자" : "적자"}
              </span>
            </div>
            <div className={`text-2xl font-black tabular-nums tracking-tight leading-none ${netFlow >= 0 ? "text-success" : "text-error"}`}>
              {netFlow >= 0 ? "+" : ""}{netFlow.toLocaleString()}
              <span className="text-sm font-normal text-base-content/40 ml-1">원</span>
            </div>
            <div className="mt-3 h-1.5 bg-base-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${netFlow >= 0 ? "bg-success/50" : "bg-error/50"}`} style={{ width: netFlow === 0 ? "8%" : "50%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Row 3: Info Strip — 출금 한도 + 요약 ─── */}
      <div className="card card-border bg-base-100 shadow-sm border-base-300 overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-base-300">
          <div className="p-5">
            <div className="text-sm font-medium text-base-content/50 uppercase tracking-widest mb-2">1회 최소</div>
            <div className="text-xl font-bold tabular-nums text-base-content/80">{minSend.toLocaleString()}<span className="text-sm font-normal text-base-content/40 ml-1">원</span></div>
          </div>
          <div className="p-5">
            <div className="text-sm font-medium text-base-content/50 uppercase tracking-widest mb-2">1회 최대</div>
            <div className="text-xl font-bold tabular-nums text-base-content/80">{maxSend.toLocaleString()}<span className="text-sm font-normal text-base-content/40 ml-1">원</span></div>
          </div>
          <div className="p-5">
            <div className="text-sm font-medium text-base-content/50 uppercase tracking-widest mb-2">금일 입금건</div>
            <div className="text-xl font-bold tabular-nums text-base-content/80">{depositCount}<span className="text-sm font-normal text-base-content/40 ml-1">건</span></div>
          </div>
          <div className="p-5">
            <div className="text-sm font-medium text-base-content/50 uppercase tracking-widest mb-2">금일 출금건</div>
            <div className="text-xl font-bold tabular-nums text-base-content/80">{withdrawCount}<span className="text-sm font-normal text-base-content/40 ml-1">건</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
