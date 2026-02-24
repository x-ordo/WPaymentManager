"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "종합 대시보드", matchExact: true },
  { href: "/withdrawals", label: "출금 관리" },
  { href: "/deposits", label: "입금 관리" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive = item.matchExact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold rounded-md transition-colors duration-fast ${
              isActive
                ? "bg-surface-primary-light text-primary-text"
                : "text-ink-tertiary hover:bg-surface-hover hover:text-ink-secondary"
            }`}
          >
            {isActive && <span className="w-1 h-4 bg-primary rounded-full shrink-0" />}
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
