import { getDepositApplications, getDepositNotifications } from "@/actions/legacy";

export const dynamic = "force-dynamic";

export default async function DepositsPage(props: {
  searchParams: Promise<{ sdate?: string; edate?: string; tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const today = new Date().toISOString().split("T")[0];
  const sdate = searchParams.sdate || `${today} 00:00:00`;
  const edate = searchParams.edate || `${today} 23:59:59`;
  const tab = searchParams.tab || "application";

  const appRes = await getDepositApplications(sdate, edate);
  const notiRes = await getDepositNotifications(sdate, edate);

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
    <div className="space-y-5">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <h1 className="text-xl font-bold tracking-tight">입금 통합 관리</h1>
          <div role="tablist" className="tabs tabs-box tabs-sm">
            <a
              role="tab"
              href={`/deposits?tab=application&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
              className={`tab font-semibold ${tab === "application" ? "tab-active" : ""}`}
            >
              입금 신청 내역
              {appData.length > 0 && (
                <span className="badge badge-sm badge-ghost ml-1.5 font-mono">{appData.length}</span>
              )}
            </a>
            <a
              role="tab"
              href={`/deposits?tab=notification&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
              className={`tab font-semibold ${tab === "notification" ? "tab-active" : ""}`}
            >
              입금 통지 이력
              {notiData.length > 0 && (
                <span className="badge badge-sm badge-ghost ml-1.5 font-mono">{notiData.length}</span>
              )}
            </a>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats stats-horizontal shadow w-full">
        <div className="stat">
          <div className="stat-title">총 입금액</div>
          <div className="stat-value text-xl font-mono tabular-nums">
            {totalAmount.toLocaleString()}<span className="text-xs text-base-content/40 font-medium ml-1">원</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">{tab === "application" ? "접수 완료" : "처리 완료"}</div>
          <div className="stat-value text-xl font-mono tabular-nums text-success">
            {successCount}<span className="text-xs text-base-content/40 font-medium ml-1">건</span>
          </div>
        </div>
        {tab === "notification" && (
          <div className="stat">
            <div className="stat-title">미처리</div>
            <div className="stat-value text-xl font-mono tabular-nums text-warning">
              {pendingCount}<span className="text-xs text-base-content/40 font-medium ml-1">건</span>
            </div>
          </div>
        )}
        <div className="stat">
          <div className="stat-title">전체 건수</div>
          <div className="stat-value text-xl font-mono tabular-nums">
            {listData.length}<span className="text-xs text-base-content/40 font-medium ml-1">건</span>
          </div>
        </div>
      </div>

      {/* Filter */}
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

      {/* Data Table */}
      <div className="card card-border bg-base-100 overflow-hidden">
        <table className="table table-zebra table-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide">
              <th>일시</th>
              <th>가맹점</th>
              <th>{tab === "application" ? "Unique ID" : "주문 / 트랜잭션 ID"}</th>
              <th className="text-right">입금액</th>
              <th>{tab === "application" ? "예금주" : "입금주"}</th>
              <th className="text-center">상태</th>
            </tr>
          </thead>
          <tbody>
            {listData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="text-base-content/40">조회된 입금 데이터가 없습니다.</div>
                  <div className="text-2xs text-base-content/30 mt-1">조회기간을 변경하여 다시 시도해 보세요.</div>
                </td>
              </tr>
            ) : (
              listData.map((row: any) => (
                <tr key={row._UNIQUEID}>
                  <td className="font-mono text-xs text-base-content/50 whitespace-nowrap">
                    {row._CREATE_DATETIME || row._DATETIME}
                  </td>
                  <td className="font-semibold">{row._AFFILIATE_ID}</td>
                  <td className="font-mono text-xs">
                    {tab === "application" ? (
                      <span className="text-base-content/50">{row._UNIQUEID}</span>
                    ) : (
                      <div>
                        <div className="font-semibold truncate max-w-[14rem]">{row._ORDER_ID}</div>
                        <div className="text-base-content/40 text-2xs mt-0.5 truncate max-w-[14rem]">{row._TR_ID}</div>
                      </div>
                    )}
                  </td>
                  <td className="text-right font-bold font-mono tabular-nums whitespace-nowrap">
                    {Number(row._ORDERAMT || row._AMOUNT || 0).toLocaleString()}원
                  </td>
                  <td className="font-semibold">{row._ORDERNM || row._IN_BANK_USERNAME}</td>
                  <td className="text-center">
                    <span className={`badge badge-sm ${
                      tab === "application"
                        ? "badge-info badge-soft"
                        : row._STATE !== "0"
                          ? "badge-success badge-soft"
                          : "badge-ghost"
                    }`}>
                      {tab === "application" ? "접수완료" : row._STATE !== "0" ? "처리완료" : "대기"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
