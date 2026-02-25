import { getBalanceInfo, getUserClass } from "@/actions/legacy";

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
  
  const balance = balanceRes.code === "1" ? balanceRes : null;
  const gradeName = (userClass && CLASS_MAP[userClass]) || "일반";

  const aproValue = Number(balance?._APROVALUE || 0);
  const isAproWarning = aproValue > 0 && aproValue <= 7;

  return (
    <div className="px-5 py-4 border-b border-base-300 bg-base-200 space-y-3">
      <div className="space-y-2.5">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-medium text-base-content/50">사용자 등급</span>
          <span className="text-sm font-bold text-primary">
            {gradeName}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-medium text-base-content/50">보유금액</span>
          <span className="text-lg font-bold font-mono tracking-tighter tabular-nums">
            {Number(balance?._MONEY || 0).toLocaleString()}<span className="text-xs text-base-content/40 ml-0.5">원</span>
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-medium text-base-content/50">사용가능일</span>
          <span className={`text-lg font-bold font-mono tracking-tighter tabular-nums ${isAproWarning ? "text-error" : "text-primary"}`}>
            {balance?._APROVALUE || "-"}<span className="text-xs text-base-content/40 ml-0.5">일</span>
          </span>
        </div>
      </div>
      <div className="divider my-0"></div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-base-content/40">입금수수료</span>
          <span className="font-mono font-semibold tabular-nums">
            {balance?._COMMISION_PERIN || "0"}% + {Number(balance?._COMMISION_IN || 0).toLocaleString()}원
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-base-content/40">출금수수료</span>
          <span className="font-mono font-semibold tabular-nums">
            {balance?._COMMISION_PEROUT || "0"}% + {Number(balance?._COMMISION_OUT || 0).toLocaleString()}원
          </span>
        </div>
      </div>
    </div>
  );
}

export function SidebarSummarySkeleton() {
  return (
    <div className="px-5 py-4 border-b border-base-300 bg-base-200 space-y-3">
      <div className="space-y-2.5">
        <div className="flex justify-between items-baseline">
          <div className="skeleton h-4 w-18" />
          <div className="skeleton h-4 w-12" />
        </div>
        <div className="flex justify-between items-baseline">
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-6 w-28" />
        </div>
        <div className="flex justify-between items-baseline">
          <div className="skeleton h-4 w-18" />
          <div className="skeleton h-6 w-14" />
        </div>
      </div>
      <div className="divider my-0"></div>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <div className="skeleton h-3 w-18" />
          <div className="skeleton h-3 w-24" />
        </div>
        <div className="flex justify-between">
          <div className="skeleton h-3 w-18" />
          <div className="skeleton h-3 w-24" />
        </div>
      </div>
    </div>
  );
}
