import { getUserName } from "@/actions/legacy";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export async function HeaderUser() {
  const [userName, sessionUser] = await Promise.all([
    getUserName(),
    getSessionUser(),
  ]);
  const displayName = sessionUser || userName;

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="flex items-center gap-3 cursor-pointer">
        <div className="flex flex-col items-end">
          <span className="text-base font-bold">{displayName}</span>
          <span className="text-xs font-medium text-base-content/40">
            {sessionUser ? "운영자" : "Master"}
          </span>
        </div>
        <div className="avatar placeholder">
          <div className="bg-primary/10 text-primary w-10 rounded-full border border-base-300">
            <span className="text-sm font-bold">{displayName.charAt(0)}</span>
          </div>
        </div>
      </div>
      <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-40 p-2 shadow-lg border border-base-300 mt-2">
        <li><LogoutButton /></li>
      </ul>
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
