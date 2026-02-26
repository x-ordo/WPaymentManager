import { getWithdrawalList, getWithdrawalNotifications } from "@/actions/legacy";
import { getLegacyErrorMessage } from "@/lib/error-codes";
import { getKSTDate } from "@/lib/utils";
import { SearchFilter } from "@/components/SearchFilter";
import WithdrawalTable from "./WithdrawalTable";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WithdrawalsPage(props: {
  searchParams: Promise<{ sdate?: string; edate?: string; tab?: string }>;
}) {
  const searchParams = await props.searchParams;

  // KST 기반 기본값 설정
  const sdate = searchParams.sdate || getKSTDate(0, 'start');
  const edate = searchParams.edate || getKSTDate(0, 'end');
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
    <div className="space-y-3">
      {/* ─── Row 1: Header + Tabs ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-black tracking-tight text-base-content">출금 통합 관리</h1>
          <div role="tablist" className="tabs tabs-box bg-base-200/50 p-1 rounded-lg">
            <Link
              role="tab"
              href={`/withdrawals?tab=active&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
              className={`tab font-bold transition-all ${tab === "active" ? "tab-active bg-primary text-primary-content shadow-sm" : "text-base-content/40"}`}
            >
              출금신청내역
              {activeData.length > 0 && (
                <span className={`badge badge-sm ml-2 ${tab === 'active' ? 'badge-ghost opacity-50' : 'badge-neutral'}`}>{activeData.length}</span>
              )}
            </Link>
            <Link
              role="tab"
              href={`/withdrawals?tab=history&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
              className={`tab font-bold transition-all ${tab === "history" ? "tab-active bg-primary text-primary-content shadow-sm" : "text-base-content/40"}`}
            >
              출금통지내역
              {historyData.length > 0 && (
                <span className={`badge badge-sm ml-2 ${tab === 'history' ? 'badge-ghost opacity-50' : 'badge-neutral'}`}>{historyData.length}</span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Row 2: Compact Stats ─── */}
      <div className="grid grid-cols-4 gap-px bg-base-300 rounded-xl overflow-hidden border border-base-300">
        <div className="bg-base-100 px-5 py-3">
          <div className="text-sm font-medium text-base-content/50 uppercase tracking-widest">총 신청 금액</div>
          <div className="text-xl font-black tabular-nums text-base-content mt-1">
            {totalAmount.toLocaleString()}<span className="text-sm font-normal text-base-content/40 ml-1">원</span>
          </div>
        </div>
        <div className="bg-base-100 px-5 py-3">
          <div className="text-sm font-medium text-base-content/50 uppercase tracking-widest">정상 처리</div>
          <div className="text-xl font-black tabular-nums text-success mt-1">
            {successCount}<span className="text-sm font-normal text-base-content/40 ml-1">건</span>
          </div>
        </div>
        <div className="bg-base-100 px-5 py-3">
          <div className="text-sm font-medium text-base-content/50 uppercase tracking-widest">대기중</div>
          <div className="text-xl font-black tabular-nums text-warning mt-1">
            {pendingCount}<span className="text-sm font-normal text-base-content/40 ml-1">건</span>
          </div>
        </div>
        <div className="bg-base-100 px-5 py-3">
          <div className="text-sm font-medium text-base-content/50 uppercase tracking-widest">오류 / 취소</div>
          <div className={`text-xl font-black tabular-nums mt-1 ${errorCount > 0 ? "text-error" : "text-base-content/20"}`}>
            {errorCount}<span className="text-sm font-normal text-base-content/40 ml-1">건</span>
          </div>
        </div>
      </div>

      {/* ─── Row 3: Filter Bar ─── */}
      <SearchFilter tab={tab} sdate={sdate} edate={edate} />

      {/* ─── Row 4: Table ─── */}
      {errorRes ? (
        <div className="card card-border bg-base-100 p-24 text-center shadow-sm">
          <div className="text-error font-bold text-2xl mb-3 flex items-center justify-center gap-3">
            <span className="inline-block w-3 h-3 rounded-full bg-error animate-ping" />
            데이터 로드 오류
          </div>
          <div className="text-base-content/50 text-lg font-medium">
            {getLegacyErrorMessage(tab === "active" ? "/51000" : "/30000", errorRes.code)}
          </div>
          <Link
            href={`/withdrawals?tab=${tab}&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
            className="btn btn-ghost btn-md mt-8 text-base-content/40 hover:text-primary font-bold"
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
