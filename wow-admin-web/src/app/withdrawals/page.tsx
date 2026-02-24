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
          <h1 className="text-xl font-bold tracking-tight">출금 통합 관리</h1>
          <div role="tablist" className="tabs tabs-box tabs-sm">
            <Link
              role="tab"
              href={`/withdrawals?tab=active&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
              className={`tab font-semibold ${tab === "active" ? "tab-active" : ""}`}
            >
              출금신청내역
              {activeData.length > 0 && (
                <span className="badge badge-sm badge-ghost ml-1.5 font-mono">{activeData.length}</span>
              )}
            </Link>
            <Link
              role="tab"
              href={`/withdrawals?tab=history&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
              className={`tab font-semibold ${tab === "history" ? "tab-active" : ""}`}
            >
              출금통지내역
              {historyData.length > 0 && (
                <span className="badge badge-sm badge-ghost ml-1.5 font-mono">{historyData.length}</span>
              )}
            </Link>
          </div>
        </div>
        <Link href="/withdrawals/apply" className="btn btn-primary btn-sm">
          신규 출금 신청
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="stats stats-horizontal shadow w-full">
        <div className="stat">
          <div className="stat-title">총 신청 금액</div>
          <div className="stat-value text-xl font-mono tabular-nums">
            {totalAmount.toLocaleString()}<span className="text-xs text-base-content/40 font-medium ml-1">원</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">정상 처리</div>
          <div className="stat-value text-xl font-mono tabular-nums text-success">
            {successCount}<span className="text-xs text-base-content/40 font-medium ml-1">건</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">대기중</div>
          <div className="stat-value text-xl font-mono tabular-nums text-warning">
            {pendingCount}<span className="text-xs text-base-content/40 font-medium ml-1">건</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">오류 / 취소</div>
          <div className={`stat-value text-xl font-mono tabular-nums ${errorCount > 0 ? "text-error" : ""}`}>
            {errorCount}<span className="text-xs text-base-content/40 font-medium ml-1">건</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card card-border bg-base-100">
        <div className="card-body p-4">
          <form className="flex items-center gap-3 justify-center">
            <span className="text-xs font-medium text-base-content/50 uppercase tracking-wide">조회기간</span>
            <input name="sdate" defaultValue={sdate} className="input input-bordered input-sm font-mono w-48" />
            <span className="text-base-content/30 font-medium">~</span>
            <input name="edate" defaultValue={edate} className="input input-bordered input-sm font-mono w-48" />
            <input type="hidden" name="tab" value={tab} />
            <button className="btn btn-primary btn-sm ml-1">조회</button>
          </form>
        </div>
      </div>

      <WithdrawalTable initialData={listData} viewMode={tab} />
    </div>
  );
}
