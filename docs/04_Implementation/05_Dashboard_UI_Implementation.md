가장 핵심적인 자금 유동성과 시스템 사용 기한(리스크)을 한눈에 파악할 수 있는 **메인 대시보드 화면**입니다.

제공해주신 `90000` API(보유금액, 수수료, 사용가능일)와 `90100` API(출금 한도)를 병렬로 호출(`Promise.all`)하여 로딩 속도를 최적화했으며, 장식적인 요소를 배제하고 숫자의 가독성에만 집중한 금융망 스타일입니다.

### 대시보드 메인 화면 (`src/app/page.tsx`)

```tsx
import { getBalanceInfo, getWithdrawalLimits } from "@/actions/legacy";

export default async function DashboardPage() {
  // 90000, 90100 API 병렬 호출 (속도 최적화)
  const [balanceRes, limitRes] = await Promise.all([
    getBalanceInfo(),
    getWithdrawalLimits(),
  ]);

  // 응답 검증 및 기본값 세팅
  const balanceData = balanceRes.code === "1" ? balanceRes : null;
  const limitData = limitRes.code === "1" ? limitRes : null;

  // 리스크 관리: 사용 가능일이 7일 이하일 경우 경고 스타일 적용
  const aproValue = Number(balanceData?._APROVALUE || 0);
  const isAproWarning = aproValue <= 7;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          종합 대시보드
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          시스템 자금 현황 및 수수료/한도 정책
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. 보유 자금 및 기한 패널 (가장 중요) */}
        <div className="col-span-1 md:col-span-3 bg-white border border-gray-400 p-4 shadow-sm flex flex-col md:flex-row justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">
              현재 보유 금액
            </h2>
            <div className="mt-1">
              <span className="text-3xl font-extrabold text-gray-900 tracking-tighter">
                {balanceData
                  ? Number(balanceData._MONEY).toLocaleString()
                  : "0"}
              </span>
              <span className="text-lg font-bold text-gray-600 ml-1">원</span>
            </div>
          </div>

          <div className="mt-4 md:mt-0 text-right">
            <h2 className="text-sm font-semibold text-gray-700">
              시스템 사용 가능일
            </h2>
            <div className="mt-1">
              <span
                className={`text-2xl font-bold tracking-tighter ${isAproWarning ? "text-red-600" : "text-blue-700"}`}
              >
                {balanceData ? balanceData._APROVALUE : "-"}
              </span>
              <span className="text-sm font-medium text-gray-600 ml-1">
                일 남음
              </span>
            </div>
            {isAproWarning && (
              <p className="text-xs text-red-500 mt-1 font-semibold animate-pulse">
                ※ 기한 연장이 필요합니다.
              </p>
            )}
          </div>
        </div>

        {/* 2. 출금 한도 정책 패널 */}
        <div className="bg-white border border-gray-300 p-4">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3">
            출금 한도 정책
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">1회 최소 출금액</span>
              <span className="font-mono font-semibold tracking-tighter text-gray-900">
                {limitData
                  ? Number(limitData._MINSENDMONEY).toLocaleString()
                  : "-"}{" "}
                원
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">1회 최대 출금액</span>
              <span className="font-mono font-semibold tracking-tighter text-gray-900">
                {limitData
                  ? Number(limitData._MAXSENDMONEY).toLocaleString()
                  : "-"}{" "}
                원
              </span>
            </div>
          </div>
        </div>

        {/* 3. 입금 수수료 정책 패널 */}
        <div className="bg-white border border-gray-300 p-4">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3">
            입금 수수료 정책
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">입금 퍼센트 수수료</span>
              <span className="font-mono font-semibold tracking-tighter text-gray-900">
                {balanceData ? balanceData._COMMISION_PERIN : "-"} %
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">입금 고정 수수료</span>
              <span className="font-mono font-semibold tracking-tighter text-gray-900">
                {balanceData
                  ? Number(balanceData._COMMISION_IN).toLocaleString()
                  : "-"}{" "}
                원
              </span>
            </div>
          </div>
        </div>

        {/* 4. 출금 수수료 정책 패널 */}
        <div className="bg-white border border-gray-300 p-4">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3">
            출금 수수료 정책
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">출금 퍼센트 수수료</span>
              <span className="font-mono font-semibold tracking-tighter text-gray-900">
                {balanceData ? balanceData._COMMISION_PEROUT : "-"} %
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">출금 고정 수수료</span>
              <span className="font-mono font-semibold tracking-tighter text-gray-900">
                {balanceData
                  ? Number(balanceData._COMMISION_OUT).toLocaleString()
                  : "-"}{" "}
                원
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 적용 포인트

1. **API 호출 최적화:** `Promise.all`을 사용하여 두 개의 API 통신을 동시에 진행하므로, 로딩 대기 시간이 절반으로 단축됩니다.
2. **리스크 시각화:** `_APROVALUE`(사용가능일)가 7일 이하로 떨어지면 텍스트가 빨간색으로 변하며 경고 문구가 깜빡입니다. 이는 시스템 정지(Code 2: 사용 기간 만료)로 인한 업무 마비를 선제적으로 방어하기 위함입니다.
3. **데이터 무결성 방어:** API 응답 코드가 '1'이 아닐 경우 UI가 깨지거나 크래시가 나지 않도록 `?` (Optional Chaining)과 방어 코드를 철저히 적용했습니다.

---

이제 핵심인 **대시보드(조회)**와 **출금 관리(통제)** 뷰가 모두 완성되었습니다.

이 두 화면을 자연스럽게 이동할 수 있도록, 화면 좌측에 고정되어 메뉴 이동을 돕는 **LNB(Local Navigation Bar)를 포함한 글로벌 레이아웃(`src/app/layout.tsx`)**을 작성하여 프로젝트 구조를 최종 마무리할까요?
