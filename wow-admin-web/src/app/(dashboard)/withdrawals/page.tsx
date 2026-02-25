import { getWithdrawalList, getWithdrawalNotifications } from "@/actions/legacy";
import { getLegacyErrorMessage } from "@/lib/error-codes";
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

  // 에러 체크 (1:성공, 3:데이터없음 제외한 모든 코드는 에러로 간주)
  const errorRes = (activeRes.code !== "1" && activeRes.code !== "3") ? activeRes : 
                   (historyRes.code !== "1" && historyRes.code !== "3") ? historyRes : null;

  const activeData = activeRes.data || [];
  const historyData = historyRes.data || [];
  const listData = tab === "active" ? activeData : historyData;

  const totalAmount = listData.reduce((acc: number, cur: any) => acc + Number(cur._MONEY || 0), 0);
  const successCount = listData.filter((i: any) => i._STATE === "1" || i._USE === "True").length;
  const pendingCount = listData.filter((i: any) => i._STATE === "0").length;
  const errorCount = listData.length - successCount - pendingCount;

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-5">
          <h1 className="text-2xl font-bold tracking-tight">출금 통합 관리</h1>
          <div role="tablist" className="tabs tabs-box">
            <Link
              role="tab"
              href={`/withdrawals?tab=active&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
              className={`tab font-semibold ${tab === "active" ? "tab-active" : ""}`}
            >
              출금신청내역
              {activeData.length > 0 && (
                <span className="badge badge-ghost ml-2 font-mono">{activeData.length}</span>
              )}
            </Link>
            <Link
              role="tab"
              href={`/withdrawals?tab=history&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
              className={`tab font-semibold ${tab === "history" ? "tab-active" : ""}`}
            >
              출금통지내역
              {historyData.length > 0 && (
                <span className="badge badge-ghost ml-2 font-mono">{historyData.length}</span>
              )}
            </Link>
          </div>
        </div>
        <Link href="/withdrawals/apply" className="btn btn-primary">
          신규 출금 신청
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="stats stats-horizontal shadow w-full">
        <div className="stat py-5">
          <div className="stat-title text-sm">총 신청 금액</div>
          <div className="stat-value text-2xl font-mono tabular-nums">
            {totalAmount.toLocaleString()}<span className="text-sm text-base-content/40 font-medium ml-1">원</span>
          </div>
        </div>
        <div className="stat py-5">
          <div className="stat-title text-sm">정상 처리</div>
          <div className="stat-value text-2xl font-mono tabular-nums text-success">
            {successCount}<span className="text-sm text-base-content/40 font-medium ml-1">건</span>
          </div>
        </div>
        <div className="stat py-5">
          <div className="stat-title text-sm">대기중</div>
          <div className="stat-value text-2xl font-mono tabular-nums text-warning">
            {pendingCount}<span className="text-sm text-base-content/40 font-medium ml-1">건</span>
          </div>
        </div>
        <div className="stat py-5">
          <div className="stat-title text-sm">오류 / 취소</div>
          <div className={`stat-value text-2xl font-mono tabular-nums ${errorCount > 0 ? "text-error" : ""}`}>
            {errorCount}<span className="text-sm text-base-content/40 font-medium ml-1">건</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card card-border bg-base-100">
        <div className="card-body p-5">
          <form className="flex items-center gap-3 justify-center">
            <span className="text-sm font-medium text-base-content/50 uppercase tracking-wide">조회기간</span>
            <input name="sdate" defaultValue={sdate} className="input input-bordered font-mono w-52" />
            <span className="text-base-content/30 font-medium text-lg">~</span>
            <input name="edate" defaultValue={edate} className="input input-bordered font-mono w-52" />
            <input type="hidden" name="tab" value={tab} />
            <button className="btn btn-primary ml-2">조회</button>
          </form>
        </div>
      </div>

      {errorRes ? (
        <div className="card card-border bg-base-100 p-20 text-center">
          <div className="text-error font-bold text-xl mb-3 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-error animate-pulse" />
            데이터 로드 오류
          </div>
          <div className="text-base-content/50 text-base font-medium">
            {getLegacyErrorMessage(tab === "active" ? "/51000" : "/30000", errorRes.code)}
          </div>
          <Link 
            href={`/withdrawals?tab=${tab}&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
            className="btn btn-ghost btn-sm mt-6 text-base-content/30"
          >
            새로고침 시도
          </Link>
        </div>
      ) : (
        <WithdrawalTable initialData={listData} viewMode={tab} />
      )}
    </div>
  );
}
