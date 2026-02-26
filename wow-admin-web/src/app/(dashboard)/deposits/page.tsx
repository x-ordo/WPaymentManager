import { getDepositApplications, getDepositNotifications } from "@/actions/legacy";
import { getLegacyErrorMessage } from "@/lib/error-codes";
import { getKSTDate } from "@/lib/utils";
import { SearchFilter } from "@/components/SearchFilter";
import { DepositTable } from "./DepositTable";
import { ToastTrigger } from "@/components/ToastTrigger";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DepositsPage(props: {
  searchParams: Promise<{ sdate?: string; edate?: string; tab?: string }>;
}) {
  const searchParams = await props.searchParams;

  // KST 기반 기본값 설정
  const sdate = searchParams.sdate || getKSTDate(0, 'start');
  const edate = searchParams.edate || getKSTDate(0, 'end');
  const tab = searchParams.tab || "application";

  const appRes = await getDepositApplications(sdate, edate);
  const notiRes = await getDepositNotifications(sdate, edate);

  // 에러 체크 (1:성공, 3:데이터없음 제외한 모든 코드는 에러로 간주)
  const errorRes = (appRes.code !== "1" && appRes.code !== "3") ? appRes :
                   (notiRes.code !== "1" && notiRes.code !== "3") ? notiRes : null;

  const appData = appRes.data || [];
  const notiData = notiRes.data || [];
  const listData = tab === "application" ? appData : notiData;
  const totalAmount = listData.reduce((acc: number, cur: any) => acc + Number(cur._ORDERAMT || cur._AMOUNT || 0), 0);

  const successCount = tab === "notification"
    ? listData.filter((i: any) => i._STATE !== "0").length
    : listData.length;
  const pendingCount = tab === "notification"
    ? listData.filter((i: any) => i._STATE === "0").length
    : 0;

  return (
    <div className="space-y-3">
      {/* ─── Row 1: Header + Tabs ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-black tracking-tight text-base-content">입금 통합 관리</h1>
          <div role="tablist" className="tabs tabs-box bg-base-200/50 p-1 rounded-lg">
            <Link
              role="tab"
              href={`/deposits?tab=application&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
              className={`tab font-bold transition-all ${tab === "application" ? "tab-active bg-primary text-primary-content shadow-sm" : "text-base-content/40"}`}
            >
              입금 신청 내역
              {appData.length > 0 && (
                <span className={`badge badge-sm ml-2 ${tab === 'application' ? 'badge-ghost opacity-50' : 'badge-neutral'}`}>{appData.length}</span>
              )}
            </Link>
            <Link
              role="tab"
              href={`/deposits?tab=notification&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
              className={`tab font-bold transition-all ${tab === "notification" ? "tab-active bg-primary text-primary-content shadow-sm" : "text-base-content/40"}`}
            >
              입금 통지 이력
              {notiData.length > 0 && (
                <span className={`badge badge-sm ml-2 ${tab === 'notification' ? 'badge-ghost opacity-50' : 'badge-neutral'}`}>{notiData.length}</span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Row 2: Compact Stats ─── */}
      <div className="grid grid-cols-3 gap-px bg-base-300 rounded-xl overflow-hidden border border-base-300">
        <div className="bg-base-100 px-5 py-3">
          <div className="text-sm font-medium text-base-content/50 uppercase tracking-widest">총 입금액</div>
          <div className="text-xl font-black tabular-nums text-base-content mt-1">
            {totalAmount.toLocaleString()}<span className="text-sm font-normal text-base-content/40 ml-1">원</span>
          </div>
        </div>
        <div className="bg-base-100 px-5 py-3">
          <div className="text-sm font-medium text-base-content/50 uppercase tracking-widest">{tab === "application" ? "접수 완료" : "처리 완료"}</div>
          <div className="text-xl font-black tabular-nums text-success mt-1">
            {successCount}<span className="text-sm font-normal text-base-content/40 ml-1">건</span>
          </div>
        </div>
        {tab === "notification" ? (
          <div className="bg-base-100 px-5 py-3">
            <div className="text-sm font-medium text-base-content/50 uppercase tracking-widest">미처리</div>
            <div className="text-xl font-black tabular-nums text-warning mt-1">
              {pendingCount}<span className="text-sm font-normal text-base-content/40 ml-1">건</span>
            </div>
          </div>
        ) : (
          <div className="bg-base-100 px-5 py-3">
            <div className="text-sm font-medium text-base-content/50 uppercase tracking-widest">전체 건수</div>
            <div className="text-xl font-black tabular-nums text-base-content mt-1">
              {listData.length}<span className="text-sm font-normal text-base-content/40 ml-1">건</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Row 3: Filter Bar ─── */}
      <SearchFilter tab={tab} sdate={sdate} edate={edate} />

      {/* ─── Row 4: Table ─── */}
      {errorRes ? (
        <div className="card card-border bg-base-100 py-32 text-center shadow-sm">
          <ToastTrigger message={getLegacyErrorMessage(tab === "application" ? "/21000" : "/40000", errorRes.code)} />
          <div className="text-error font-bold text-2xl mb-3 flex items-center justify-center gap-3">
            <span className="inline-block w-3 h-3 rounded-full bg-error animate-ping" />
            데이터 로드 오류
          </div>
          <div className="text-base-content/50 text-lg font-medium">
            {getLegacyErrorMessage(tab === "application" ? "/21000" : "/40000", errorRes.code)}
          </div>
          <Link
            href={`/deposits?tab=${tab}&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
            className="btn btn-ghost btn-md mt-8 text-base-content/40 hover:text-primary font-bold"
          >
            새로고침 시도
          </Link>
        </div>
      ) : (
        <DepositTable initialData={listData} tab={tab} />
      )}
    </div>
  );
}
