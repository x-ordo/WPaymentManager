import { getBalanceInfo } from "@/actions/legacy";

export async function HeaderUser() {
  const balanceRes = await getBalanceInfo();
  const balance = balanceRes.code === "1" ? balanceRes : null;
  const userName = balance?._IN_NAME || "Admin";

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end">
        <span className="text-sm font-bold text-ink-secondary">{userName}</span>
        <span className="text-2xs font-medium text-ink-muted">Master</span>
      </div>
      <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center border border-border-default">
        <span className="text-xs font-bold text-primary-text">
          {userName.charAt(0)}
        </span>
      </div>
    </div>
  );
}

export function HeaderUserSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="flex flex-col items-end gap-1">
        <div className="h-4 w-16 bg-surface-muted rounded" />
        <div className="h-3 w-10 bg-surface-muted rounded" />
      </div>
      <div className="w-8 h-8 bg-surface-muted rounded-full" />
    </div>
  );
}
