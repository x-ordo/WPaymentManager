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
          <h1 className="text-xl font-bold text-ink-primary tracking-tight">입금 통합 관리</h1>
          <div className="flex bg-surface-muted p-0.5 rounded-md border border-border-subtle">
            <a
              href={`/deposits?tab=application&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
              className={`px-5 py-2 text-sm font-semibold rounded-md transition-colors duration-fast ${
                tab === "application"
                  ? "bg-surface-card text-ink-primary shadow-xs"
                  : "text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              입금 신청 내역
              {appData.length > 0 && (
                <span className="ml-1.5 text-2xs font-bold text-ink-muted tabular-nums">{appData.length}</span>
              )}
            </a>
            <a
              href={`/deposits?tab=notification&sdate=${encodeURIComponent(sdate)}&edate=${encodeURIComponent(edate)}`}
              className={`px-5 py-2 text-sm font-semibold rounded-md transition-colors duration-fast ${
                tab === "notification"
                  ? "bg-surface-card text-ink-primary shadow-xs"
                  : "text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              입금 통지 이력
              {notiData.length > 0 && (
                <span className="ml-1.5 text-2xs font-bold text-ink-muted tabular-nums">{notiData.length}</span>
              )}
            </a>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex gap-4">
        <div className="flex-1 bg-surface-card border border-border-default rounded-lg shadow-xs overflow-hidden">
          <div className="flex">
            <div className="w-1 bg-primary shrink-0" />
            <div className="p-4 flex-1">
              <div className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">총 입금액</div>
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
              <div className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
                {tab === "application" ? "접수 완료" : "처리 완료"}
              </div>
              <div className="text-xl font-bold text-status-success-strong font-mono tabular-nums tracking-tight">
                {successCount}<span className="text-xs text-ink-tertiary font-medium ml-1">건</span>
              </div>
            </div>
          </div>
        </div>
        {tab === "notification" && (
          <div className="flex-1 bg-surface-card border border-border-default rounded-lg shadow-xs overflow-hidden">
            <div className="flex">
              <div className="w-1 bg-status-warning shrink-0" />
              <div className="p-4 flex-1">
                <div className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">미처리</div>
                <div className="text-xl font-bold text-status-warning-strong font-mono tabular-nums tracking-tight">
                  {pendingCount}<span className="text-xs text-ink-tertiary font-medium ml-1">건</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 bg-surface-card border border-border-default rounded-lg shadow-xs overflow-hidden">
          <div className="flex">
            <div className="w-1 bg-border-strong shrink-0" />
            <div className="p-4 flex-1">
              <div className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">전체 건수</div>
              <div className="text-xl font-bold text-ink-primary font-mono tabular-nums tracking-tight">
                {listData.length}<span className="text-xs text-ink-tertiary font-medium ml-1">건</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
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
          <button className="bg-btn-primary-bg text-btn-primary-text rounded-md px-5 py-2 text-sm font-semibold hover:bg-btn-primary-hover transition-colors duration-fast ml-1">
            조회
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-surface-card border border-border-default shadow-xs rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-muted text-xs text-ink-tertiary font-medium uppercase tracking-wide border-b border-border-default">
              <th className="text-left px-4 py-3">일시</th>
              <th className="text-left px-4 py-3">가맹점</th>
              <th className="text-left px-4 py-3">{tab === "application" ? "Unique ID" : "주문 / 트랜잭션 ID"}</th>
              <th className="text-right px-4 py-3">입금액</th>
              <th className="text-left px-4 py-3">{tab === "application" ? "예금주" : "입금주"}</th>
              <th className="text-center px-4 py-3">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {listData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="text-ink-muted">조회된 입금 데이터가 없습니다.</div>
                  <div className="text-2xs text-ink-disabled mt-1">조회기간을 변경하여 다시 시도해 보세요.</div>
                </td>
              </tr>
            ) : (
              listData.map((row: any) => (
                <tr key={row._UNIQUEID} className="hover:bg-surface-hover transition-colors duration-fast">
                  <td className="px-4 py-3 font-mono text-xs text-ink-tertiary whitespace-nowrap">
                    {row._CREATE_DATETIME || row._DATETIME}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink-primary">
                    {row._AFFILIATE_ID}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {tab === "application" ? (
                      <span className="text-ink-muted">{row._UNIQUEID}</span>
                    ) : (
                      <div>
                        <div className="text-ink-secondary font-semibold truncate max-w-[14rem]">{row._ORDER_ID}</div>
                        <div className="text-ink-muted text-2xs mt-0.5 truncate max-w-[14rem]">{row._TR_ID}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold font-mono tabular-nums text-ink-primary whitespace-nowrap">
                    {Number(row._ORDERAMT || row._AMOUNT || 0).toLocaleString()}원
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink-primary">
                    {row._ORDERNM || row._IN_BANK_USERNAME}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block font-semibold text-xs px-2.5 py-1 rounded-md ${
                      tab === "application"
                        ? "bg-status-info-light text-status-info-strong"
                        : row._STATE !== "0"
                          ? "bg-status-success-light text-status-success-strong"
                          : "bg-surface-muted text-ink-muted"
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
