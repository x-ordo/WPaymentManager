import { getUserName } from "@/actions/legacy";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

const CLASS_MAP: Record<string, string> = {
  "0": "가맹점",
  "40": "지사",
  "60": "에이전시",
  "80": "운영자",
  "100": "마스터",
};

export async function HeaderUser() {
  const sessionUser = await getSessionUser();
  const displayName = sessionUser?.userName || "Guest";
  const userClass = sessionUser?.userClass || "0";
  const userRole = CLASS_MAP[userClass] || "일반";

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="flex items-center gap-3 cursor-pointer">
        <div className="flex flex-col items-end">
          <span className="text-base font-bold">{displayName}</span>
          <span className="text-xs font-medium text-base-content/40">
            {userRole}
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
