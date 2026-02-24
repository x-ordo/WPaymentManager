import { getBalanceInfo } from "@/actions/legacy";

export async function HeaderUser() {
  const balanceRes = await getBalanceInfo();
  const balance = balanceRes.code === "1" ? balanceRes : null;
  const userName = balance?._IN_NAME || "Admin";

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="flex items-center gap-3 cursor-pointer">
        <div className="flex flex-col items-end">
          <span className="text-base font-bold">{userName}</span>
          <span className="text-xs font-medium text-base-content/40">Master</span>
        </div>
        <div className="avatar placeholder">
          <div className="bg-primary/10 text-primary w-10 rounded-full border border-base-300">
            <span className="text-sm font-bold">{userName.charAt(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeaderUserSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end gap-1">
        <div className="skeleton h-5 w-20" />
        <div className="skeleton h-3.5 w-12" />
      </div>
      <div className="skeleton w-10 h-10 rounded-full" />
    </div>
  );
}
