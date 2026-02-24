import { getWithdrawalList, getWithdrawalNotifications } from "@/actions/legacy";
import WithdrawalTable from "./WithdrawalTable";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WithdrawalsPage(props: {
  searchParams: Promise<{ sdate?: string; edate?: string; tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const today = new Date().toISOString().split("T")[0];
  const sdate = searchParams.sdate || `${today} 00:00:00`;
  const edate = searchParams.edate || `${today} 23:59:59`;
  const tab = searchParams.tab || "active";

  const activeRes = await getWithdrawalList(sdate, edate);
  const historyRes = await getWithdrawalNotifications(sdate, edate);

  const activeData = activeRes.data || [];
  const historyData = historyRes.data || [];
  const listData = tab === "active" ? activeData : historyData;

  const totalAmount = listData.reduce((acc: number, cur: any) => acc + Number(cur._MONEY || 0), 0);
  const successCount = listData.filter((i: any) => i._STATE === "1" || i._USE === "True").length;
  const pendingCount = listData.filter((i: any) => i._STATE === "0").length;
  const errorCount = listData.length - successCount - pendingCount;

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-5">
          <h1 className="text-xl font-bold text-ink-primary tracking-tight">출금 통합 관리</h1>
          <div className="flex bg-surface-muted p-0.5 rounded-md border border-border-subtle">
            <Link
              href={`/withdrawals?tab=active&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
              className={`px-5 py-2 text-sm font-semibold rounded-md transition-colors duration-fast ${
                tab === "active"
                  ? "bg-surface-card text-ink-primary shadow-xs"
                  : "text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              출금신청내역
              {activeData.length > 0 && (
                <span className="ml-1.5 text-2xs font-bold text-ink-muted tabular-nums">{activeData.length}</span>
              )}
            </Link>
            <Link
              href={`/withdrawals?tab=history&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
              className={`px-5 py-2 text-sm font-semibold rounded-md transition-colors duration-fast ${
                tab === "history"
                  ? "bg-surface-card text-ink-primary shadow-xs"
                  : "text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              출금통지내역
              {historyData.length > 0 && (
                <span className="ml-1.5 text-2xs font-bold text-ink-muted tabular-nums">{historyData.length}</span>
              )}
            </Link>
          </div>
        </div>
        <Link
          href="/withdrawals/apply"
          className="bg-btn-primary-bg text-btn-primary-text px-5 py-2 text-sm font-semibold hover:bg-btn-primary-hover transition-colors duration-fast shadow-sm rounded-md"
        >
          신규 출금 신청
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="flex gap-4">
        <div className="flex-1 bg-surface-card border border-border-default rounded-lg shadow-xs overflow-hidden">
          <div className="flex">
            <div className="w-1 bg-primary shrink-0" />
            <div className="p-4 flex-1">
              <div className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">총 신청 금액</div>
              <div className="text-xl font-bold text-ink-primary font-mono tabular-nums tracking-tight">
                {totalAmount.toLocaleString()}<span className="text-xs text-ink-tertiary font-medium ml-1">원</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-surface-card border border-border-default rounded-lg shadow-xs overflow-hidden">
          <div className="flex">
            <div className="w-1 bg-status-success shrink-0" />
            <div className="p-4 flex-1">
              <div className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">정상 처리</div>
              <div className="text-xl font-bold text-status-success-strong font-mono tabular-nums tracking-tight">
                {successCount}<span className="text-xs text-ink-tertiary font-medium ml-1">건</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-surface-card border border-border-default rounded-lg shadow-xs overflow-hidden">
          <div className="flex">
            <div className="w-1 bg-status-warning shrink-0" />
            <div className="p-4 flex-1">
              <div className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">대기중</div>
              <div className="text-xl font-bold text-status-warning-strong font-mono tabular-nums tracking-tight">
                {pendingCount}<span className="text-xs text-ink-tertiary font-medium ml-1">건</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-surface-card border border-border-default rounded-lg shadow-xs overflow-hidden">
          <div className="flex">
            <div className={`w-1 shrink-0 ${errorCount > 0 ? "bg-status-danger" : "bg-border-default"}`} />
            <div className="p-4 flex-1">
              <div className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">오류 / 취소</div>
              <div className={`text-xl font-bold font-mono tabular-nums tracking-tight ${errorCount > 0 ? "text-status-danger" : "text-ink-primary"}`}>
                {errorCount}<span className="text-xs text-ink-tertiary font-medium ml-1">건</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-card border border-border-default p-4 shadow-xs rounded-lg">
        <form className="flex items-center gap-3 justify-center">
          <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">조회기간</span>
          <input
            name="sdate"
            defaultValue={sdate}
            className="border border-border-default rounded-md px-3 py-2 text-sm font-mono w-48 outline-none focus-visible:border-border-focus bg-surface-page"
          />
          <span className="text-ink-disabled font-medium">~</span>
          <input
            name="edate"
            defaultValue={edate}
            className="border border-border-default rounded-md px-3 py-2 text-sm font-mono w-48 outline-none focus-visible:border-border-focus bg-surface-page"
          />
          <input type="hidden" name="tab" value={tab} />
          <button className="bg-btn-primary-bg text-btn-primary-text rounded-md px-5 py-2 text-sm font-semibold ml-1 hover:bg-btn-primary-hover transition-colors duration-fast">
            조회
          </button>
        </form>
      </div>

      <WithdrawalTable initialData={listData} viewMode={tab} />
    </div>
  );
}
