"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WithdrawApplyModal } from "@/components/WithdrawApplyModal";

const NAV_ITEMS = [
  { href: "/", label: "대시보드", matchExact: true, icon: "📊" },
  { href: "/withdrawals", label: "출금 관리", icon: "💸" },
  { href: "/deposits", label: "입금 관리", icon: "💰" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="w-full flex flex-col gap-6 items-end">
      {/* Prime Action: Withdraw Modal — Fully Right Aligned */}
      <div className="pl-4 pr-0 w-full flex justify-end">
        <WithdrawApplyModal />
      </div>

      <ul className="menu gap-1.5 p-0 flex flex-col items-end w-full">
        {NAV_ITEMS.map((item) => {
          const isActive = item.matchExact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="w-full flex justify-end">
              <Link
                href={item.href}
                className={`relative font-bold text-lg py-4 pl-8 pr-0 flex justify-end items-center rounded-none rounded-l-2xl transition-all w-full ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-base-content/40 hover:text-base-content hover:bg-base-200/30"
                }`}
              >
                <div className="flex items-center gap-3 mr-6">
                  <span className="text-base opacity-70">{item.icon}</span>
                  <span className="tracking-tighter whitespace-nowrap">{item.label}</span>
                </div>
                {isActive && (
                  <div className="absolute right-0 w-1.5 h-10 bg-primary rounded-l-full shadow-[0_0_12px_rgba(0,103,91,0.3)]" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
