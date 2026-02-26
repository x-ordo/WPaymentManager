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
    <details className="dropdown dropdown-end">
      <summary className="btn btn-ghost gap-2">
        <div className="flex flex-col items-end">
          <span className="text-sm font-bold">{displayName}</span>
          <span className="text-sm font-medium text-base-content/40">{userRole}</span>
        </div>
        <div className="avatar avatar-placeholder">
          <div className="bg-neutral text-neutral-content w-9 rounded-full">
            <span className="text-sm font-bold">{displayName.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </summary>
      <ul className="dropdown-content menu bg-base-100 rounded-box z-10 w-48 p-2 shadow-lg border border-base-300 mt-2">
        <li><LogoutButton /></li>
      </ul>
    </details>
  );
}

export function HeaderUserSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-end gap-1">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-3 w-10" />
      </div>
      <div className="skeleton w-9 h-9 rounded-full" />
    </div>
  );
}
