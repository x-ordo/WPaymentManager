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
    <ul className="menu gap-1 p-0">
      {NAV_ITEMS.map((item) => {
        const isActive = item.matchExact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`font-semibold text-[15px] ${isActive ? "active bg-primary/10 text-primary" : ""}`}
            >
              {isActive && <span className="w-1 h-5 bg-primary rounded-full shrink-0" />}
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
