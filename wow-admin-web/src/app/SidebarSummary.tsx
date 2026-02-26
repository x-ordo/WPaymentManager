import { getBalanceInfo, getUserClass } from "@/actions/legacy";
import { ToastTrigger } from "@/components/ToastTrigger";
import { getLegacyErrorMessage } from "@/lib/error-codes";

const CLASS_MAP: Record<string, string> = {
  "0": "가맹점",
  "40": "지사",
  "60": "에이전시",
  "80": "운영자",
  "100": "마스터",
};

export async function SidebarSummary() {
  const [balanceRes, userClass] = await Promise.all([
    getBalanceInfo(),
    getUserClass(),
  ]);

  const balance = balanceRes.success ? balanceRes.data : null;
  const gradeName = (userClass && CLASS_MAP[userClass]) || "일반";
  const aproValue = Number(balance?._APROVALUE || 0);
  const isAproWarning = aproValue > 0 && aproValue <= 7;

  return (
    <div className="pl-5 pr-2 py-6 border-b border-base-300 bg-base-200/50 space-y-5 flex flex-col items-end">
      {!balanceRes.success && (
        <ToastTrigger message={getLegacyErrorMessage("/90000", balanceRes.code || "500")} />
      )}
      <div className="space-y-4 w-full flex flex-col items-end">
        <div className="flex justify-between items-center w-full">
          <span className="text-sm font-medium text-base-content/40 uppercase tracking-widest">사용자 등급</span>
          <span className="px-2.5 py-1 rounded-md bg-primary text-primary-content text-sm font-bold shadow-sm">
            {gradeName}
          </span>
        </div>
        <div className="space-y-1 text-right">
          <div className="text-sm font-medium text-base-content/40 uppercase tracking-widest">보유금액</div>
          <div className="text-2xl font-black tracking-tighter tabular-nums text-base-content/90">
            {Number(balance?._MONEY || 0).toLocaleString()}<span className="text-sm font-normal text-base-content/40 ml-1">원</span>
          </div>
        </div>
        <div className="space-y-1 text-right">
          <div className="text-sm font-medium text-base-content/40 uppercase tracking-widest">사용가능일</div>
          <div className={`text-2xl font-black tracking-tighter tabular-nums ${isAproWarning ? "text-error" : "text-primary"}`}>
            {balance?._APROVALUE || "-"}<span className="text-sm font-normal text-base-content/40 ml-1">일</span>
          </div>
        </div>
      </div>
      <div className="divider my-0 opacity-50 w-full"></div>
      <div className="space-y-2.5 w-full">
        <div className="flex justify-between items-baseline w-full">
          <span className="text-sm font-medium text-base-content/40 uppercase tracking-wider">입금수수료</span>
          <span className="text-base font-bold tabular-nums text-base-content/80">
            {balance?._COMMISION_PERIN || "0"}% + {Number(balance?._COMMISION_IN || 0).toLocaleString()}원
          </span>
        </div>
        <div className="flex justify-between items-baseline w-full">
          <span className="text-sm font-medium text-base-content/40 uppercase tracking-wider">출금수수료</span>
          <span className="text-base font-bold tabular-nums text-base-content/80">
            {balance?._COMMISION_PEROUT || "0"}% + {Number(balance?._COMMISION_OUT || 0).toLocaleString()}원
          </span>
        </div>
      </div>
    </div>
  );
}

export function SidebarSummarySkeleton() {
  return (
    <div className="pl-5 pr-4 py-6 border-b border-base-300 bg-base-200/50 space-y-5 flex flex-col items-end">
      <div className="flex justify-between items-center w-full">
        <div className="skeleton h-3 w-12" />
        <div className="skeleton h-6 w-16" />
      </div>
      <div className="space-y-4 w-full flex flex-col items-end mt-4">
        <div className="skeleton h-3 w-16 mb-1" />
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-3 w-16 mb-1" />
        <div className="skeleton h-8 w-20" />
      </div>
    </div>
  );
}
