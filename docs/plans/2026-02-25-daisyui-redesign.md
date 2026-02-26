# daisyUI 5 Comprehensive Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade wow-admin-web to fully leverage daisyUI 5 native patterns, completing the theme system, improving responsive layout, and replacing custom implementations with daisyUI components.

**Architecture:** Evolutionary upgrade — keep existing Server Component / Client Component split, replace custom styling with daisyUI 5 class names, add missing responsive breakpoints, and create reusable ConfirmModal component.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, daisyUI 5, TypeScript

---

### Task 1: Complete daisyUI 5 Theme

**Files:**
- Modify: `wow-admin-web/src/app/globals.css`

**Step 1: Replace incomplete theme with full daisyUI 5 theme block**

Replace the current `@plugin "daisyui/theme"` block (lines 49-64) with:

```css
@plugin "daisyui/theme" {
  name: "wowpay";
  default: true;
  prefersdark: false;
  color-scheme: light;
  --color-base-100: #fafafa;
  --color-base-200: #f5f5f5;
  --color-base-300: #e5e5e5;
  --color-base-content: #1a1a1a;
  --color-primary: #404040;
  --color-primary-content: #ffffff;
  --color-secondary: #737373;
  --color-secondary-content: #ffffff;
  --color-accent: #a3a3a3;
  --color-accent-content: #ffffff;
  --color-neutral: #404040;
  --color-neutral-content: #ffffff;
  --color-info: oklch(65% 0.19 240);
  --color-info-content: #ffffff;
  --color-success: oklch(62% 0.19 145);
  --color-success-content: #ffffff;
  --color-warning: oklch(75% 0.18 75);
  --color-warning-content: #1a1a1a;
  --color-error: oklch(58% 0.22 27);
  --color-error-content: #ffffff;
  --radius-selector: 0.25rem;
  --radius-field: 0.25rem;
  --radius-box: 0.5rem;
  --size-selector: 0.25rem;
  --size-field: 0.25rem;
  --border: 1px;
  --depth: 0;
  --noise: 0;
}
```

**Step 2: Verify** — Run `npm run dev`, check all pages render correctly with consistent colors.

**Step 3: Commit** — `feat: complete daisyUI 5 theme with all required color variables`

---

### Task 2: Create ConfirmModal Component

**Files:**
- Create: `wow-admin-web/src/components/ConfirmModal.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useRef, useEffect } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "error" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const btnClass = variant === "error" ? "btn-error" : variant === "warning" ? "btn-warning" : "btn-primary";

  return (
    <dialog ref={dialogRef} className="modal" onClose={onCancel}>
      <div className="modal-box">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="py-4 text-base-content/70">{message}</p>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button className={`btn ${btnClass}`} onClick={onConfirm} disabled={loading}>
            {loading && <span className="loading loading-spinner loading-sm" />}
            {confirmLabel}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}
```

**Step 2: Verify** — Confirm file compiles with `npm run build` (no type errors).

**Step 3: Commit** — `feat: add ConfirmModal component using daisyUI modal`

---

### Task 3: Redesign Sidebar Navigation

**Files:**
- Modify: `wow-admin-web/src/app/SidebarNav.tsx`

**Step 1: Replace custom right-aligned nav with daisyUI menu + icons**

Replace entire file with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "대시보드",
    matchExact: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
      </svg>
    ),
  },
  {
    href: "/withdrawals",
    label: "출금 관리",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
  {
    href: "/deposits",
    label: "입금 관리",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <ul className="menu menu-md gap-1 w-full px-4">
      {NAV_ITEMS.map((item) => {
        const isActive = item.matchExact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={isActive ? "menu-active font-bold" : "font-medium"}
            >
              {item.icon}
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
```

**Step 2: Verify** — Check sidebar renders with icons and active state highlights correctly.

**Step 3: Commit** — `refactor: sidebar nav to daisyUI menu with icons`

---

### Task 4: Simplify Sidebar Summary

**Files:**
- Modify: `wow-admin-web/src/app/SidebarSummary.tsx`

**Step 1: Simplify to show only balance + days + grade using daisyUI stats**

Replace entire file with:

```tsx
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
    <div className="px-4 py-5 border-b border-base-300 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">등급</span>
        <span className="badge badge-neutral badge-sm font-bold">{gradeName}</span>
      </div>
      <div className="stats stats-vertical bg-base-200/50 w-full">
        <div className="stat py-3 px-4">
          <div className="stat-title text-xs">보유금액</div>
          <div className="stat-value text-lg font-mono tabular-nums">
            {Number(balance?._MONEY || 0).toLocaleString()}
            <span className="text-xs text-base-content/40 font-medium ml-1">원</span>
          </div>
        </div>
        <div className="stat py-3 px-4">
          <div className="stat-title text-xs">사용가능일</div>
          <div className={`stat-value text-lg font-mono tabular-nums ${isAproWarning ? "text-error" : ""}`}>
            {balance?._APROVALUE || "-"}
            <span className="text-xs text-base-content/40 font-medium ml-1">일</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarSummarySkeleton() {
  return (
    <div className="px-4 py-5 border-b border-base-300 space-y-4">
      <div className="flex items-center justify-between">
        <div className="skeleton h-3 w-12" />
        <div className="skeleton h-5 w-14" />
      </div>
      <div className="stats stats-vertical bg-base-200/50 w-full">
        <div className="stat py-3 px-4">
          <div className="skeleton h-3 w-16 mb-2" />
          <div className="skeleton h-6 w-28" />
        </div>
        <div className="stat py-3 px-4">
          <div className="skeleton h-3 w-16 mb-2" />
          <div className="skeleton h-6 w-14" />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify** — Sidebar summary renders cleanly with two stat blocks.

**Step 3: Commit** — `refactor: simplify sidebar summary with daisyUI stats`

---

### Task 5: Redesign Dashboard Layout with Header Dropdown

**Files:**
- Modify: `wow-admin-web/src/app/(dashboard)/layout.tsx`
- Modify: `wow-admin-web/src/app/HeaderUser.tsx`

**Step 1: Update HeaderUser to include a dropdown with logout**

Replace `HeaderUser.tsx` entirely:

```tsx
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
          <span className="text-xs font-medium text-base-content/40">{userRole}</span>
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
```

**Step 2: Update LogoutButton for dropdown menu context**

Replace `LogoutButton.tsx`:

```tsx
"use client";

import { logoutAction } from "@/actions/auth";

export function LogoutButton() {
  return (
    <button
      onClick={() => logoutAction()}
      className="flex items-center gap-2 text-error"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
      </svg>
      로그아웃
    </button>
  );
}
```

**Step 3: Update layout.tsx — remove sidebar footer logout (now in header), clean up sidebar structure**

Replace `(dashboard)/layout.tsx`:

```tsx
import { Suspense } from "react";
import { SidebarNav } from "../SidebarNav";
import { SidebarSummary, SidebarSummarySkeleton } from "../SidebarSummary";
import { HeaderUser, HeaderUserSkeleton } from "../HeaderUser";
import { KSTClock } from "@/components/KSTClock";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" />

      {/* Main Content Area */}
      <div className="drawer-content flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <div className="navbar bg-base-100 border-b border-base-300 px-4 lg:px-8 min-h-16 h-16 shrink-0">
          <div className="flex-none lg:hidden">
            <label htmlFor="sidebar-drawer" className="btn btn-ghost btn-square">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-6 w-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </label>
          </div>
          <div className="flex-1 flex justify-center">
            <KSTClock />
          </div>
          <div className="flex-none">
            <Suspense fallback={<HeaderUserSkeleton />}>
              <HeaderUser />
            </Suspense>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-40">
        <label htmlFor="sidebar-drawer" aria-label="close sidebar" className="drawer-overlay" />
        <aside className="bg-base-100 border-r border-base-300 w-64 flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-5 border-b border-base-300">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-content">C</span>
            </div>
            <span className="text-base font-black tracking-tight">Creative Payment</span>
          </div>

          {/* Account Summary */}
          <Suspense fallback={<SidebarSummarySkeleton />}>
            <SidebarSummary />
          </Suspense>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
            <SidebarNav />
          </nav>

          {/* Footer info */}
          <div className="px-4 py-3 border-t border-base-300 text-center">
            <span className="text-[10px] text-base-content/30 font-mono">v1.0.0</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
```

**Step 4: Verify** — Check sidebar renders with logo left-aligned, user dropdown works, logout is accessible from header.

**Step 5: Commit** — `refactor: layout with header dropdown, simplified sidebar`

---

### Task 6: Make Dashboard Page Responsive

**Files:**
- Modify: `wow-admin-web/src/app/(dashboard)/page.tsx`

**Step 1: Add responsive grid and mobile-friendly stats**

Replace the return JSX in `page.tsx`:

```tsx
return (
  <div className="space-y-6">
    {/* Page Title */}
    <div>
      <h1 className="text-2xl font-bold tracking-tight">종합 대시보드</h1>
      <p className="text-sm text-base-content/40 mt-1">실시간 자산 현황 및 시스템 상태를 확인합니다.</p>
    </div>

    {/* Hero Row — Balance + System Status */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Balance Hero Card */}
      <div className="card card-border bg-base-100 lg:col-span-3">
        <div className="card-body p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-base-content/50 uppercase tracking-wide">현재 보유 금액</h2>
            <span className="status status-success animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-4xl lg:text-5xl font-bold font-mono tracking-tighter tabular-nums leading-none">
              {money.toLocaleString()}
            </span>
            <span className="text-lg font-semibold text-base-content/40">원</span>
          </div>

          <div className="divider my-3" />
          <div className="flex flex-wrap gap-6 lg:gap-10">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-base-content/50">입금 수수료</span>
              <span className="text-sm font-bold font-mono tabular-nums">{commIn}%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-base-content/50">출금 수수료</span>
              <span className="text-sm font-bold font-mono tabular-nums">{commOut.toLocaleString()}원</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Days Card */}
      <div className="card card-border bg-base-100 lg:col-span-2">
        <div className="card-body p-6 flex flex-col">
          <h2 className="text-sm font-semibold text-base-content/50 uppercase tracking-wide">시스템 사용 가능일</h2>

          <div className="flex-1 flex flex-col justify-center mt-4">
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl lg:text-5xl font-bold font-mono tracking-tighter tabular-nums leading-none ${isAproWarning ? "text-error" : ""}`}>
                {balance ? balance._APROVALUE : "-"}
              </span>
              <span className="text-sm font-semibold text-base-content/50">일 남음</span>
            </div>

            <div className="mt-5 w-full">
              <progress
                className={`progress w-full h-2.5 ${isAproWarning ? "progress-error" : "progress-primary"}`}
                value={aproPercent}
                max="100"
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-base-content/30">0일</span>
                <span className="text-xs text-base-content/30">30일</span>
              </div>
            </div>
          </div>

          {isAproWarning && (
            <div role="alert" className="alert alert-error alert-soft mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span className="text-sm font-semibold">잔여일이 부족합니다. 관리자에게 문의하세요.</span>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Info Grid — Limits */}
    <div className="stats stats-vertical sm:stats-horizontal shadow w-full">
      <div className="stat py-4">
        <div className="stat-title text-xs">1회 최소 출금액</div>
        <div className="stat-value text-2xl font-mono tabular-nums">{minSend.toLocaleString()}<span className="text-sm text-base-content/40 font-medium ml-1">원</span></div>
      </div>
      <div className="stat py-4">
        <div className="stat-title text-xs">1회 최대 출금액</div>
        <div className="stat-value text-2xl font-mono tabular-nums">{maxSend.toLocaleString()}<span className="text-sm text-base-content/40 font-medium ml-1">원</span></div>
      </div>
      <div className="stat py-4">
        <div className="stat-title text-xs">입금 수수료율</div>
        <div className="stat-value text-2xl font-mono tabular-nums">{commIn}<span className="text-sm text-base-content/40 font-medium ml-1">%</span></div>
      </div>
      <div className="stat py-4">
        <div className="stat-title text-xs">건당 출금 수수료</div>
        <div className="stat-value text-2xl font-mono tabular-nums">{commOut.toLocaleString()}<span className="text-sm text-base-content/40 font-medium ml-1">원</span></div>
      </div>
    </div>
  </div>
);
```

**Step 2: Verify** — Dashboard looks correct on desktop (1200px+) and mobile (375px). Stats stack vertically on mobile.

**Step 3: Commit** — `refactor: dashboard responsive grid with daisyUI stats`

---

### Task 7: Improve SearchFilter with datetime-local

**Files:**
- Modify: `wow-admin-web/src/components/SearchFilter.tsx`

**Step 1: Replace text inputs with datetime-local, use fieldset pattern, improve mobile layout**

Replace entire file:

```tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { getKSTDate } from "@/lib/utils";

interface SearchFilterProps {
  tab: string;
  sdate: string;
  edate: string;
}

export function SearchFilter({ tab, sdate, edate }: SearchFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [localSdate, setSdate] = useState(sdate);
  const [localEdate, setEdate] = useState(edate);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("sdate", localSdate);
    params.set("edate", localEdate);
    params.set("tab", tab);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const quickFilters = [
    { label: "오늘", days: 0 },
    { label: "어제", days: 1 },
    { label: "7일", days: 7 },
    { label: "이번 달", days: 30 },
  ];

  return (
    <div className="card card-border bg-base-100 shadow-sm">
      <div className="card-body p-4 gap-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center">
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-xs">조회기간</legend>
            <div className="join">
              <input
                type="text"
                className="input input-sm join-item w-44 font-mono font-bold text-center"
                value={localSdate}
                onChange={(e) => setSdate(e.target.value)}
                placeholder="YYYY-MM-DD HH:mm:ss"
              />
              <span className="join-item flex items-center px-2 bg-base-200 text-base-content/30 text-xs font-bold">~</span>
              <input
                type="text"
                className="input input-sm join-item w-44 font-mono font-bold text-center"
                value={localEdate}
                onChange={(e) => setEdate(e.target.value)}
                placeholder="YYYY-MM-DD HH:mm:ss"
              />
            </div>
          </fieldset>

          <button type="submit" disabled={isPending} className="btn btn-primary btn-sm px-6">
            {isPending ? <span className="loading loading-spinner loading-xs" /> : "조회"}
          </button>
        </form>

        {/* Quick Buttons */}
        <div className="flex justify-center gap-1.5 flex-wrap">
          {quickFilters.map((btn) => {
            const start = getKSTDate(btn.days, "start");
            const end = getKSTDate(0, "end");
            const isActive = sdate === start && edate === end;

            return (
              <Link
                key={btn.label}
                href={`${pathname}?tab=${tab}&sdate=${encodeURIComponent(start)}&edate=${encodeURIComponent(end)}`}
                className={`btn btn-xs ${isActive ? "btn-primary" : "btn-soft"}`}
              >
                {btn.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify** — Filter card renders cleanly, quick buttons highlight active state, form submits correctly.

**Step 3: Commit** — `refactor: SearchFilter with daisyUI fieldset and responsive layout`

---

### Task 8: Improve Deposits Page Responsive Layout

**Files:**
- Modify: `wow-admin-web/src/app/(dashboard)/deposits/page.tsx`

**Step 1: Make stats responsive and improve tab layout for mobile**

Key changes to the return JSX:
- Tab section: `flex flex-col sm:flex-row items-start sm:items-center gap-3`
- Stats: `stats-vertical sm:stats-horizontal`
- Remove `shadow` from stats (unnecessary with card-border style)

**Step 2: Verify** — Deposits page works on mobile and desktop.

**Step 3: Commit** — `refactor: deposits page responsive layout`

---

### Task 9: Improve Withdrawals Page Responsive Layout

**Files:**
- Modify: `wow-admin-web/src/app/(dashboard)/withdrawals/page.tsx`

**Step 1: Same responsive patterns as deposits page**

Key changes:
- Tab section: `flex flex-col sm:flex-row items-start sm:items-center gap-3`
- Stats: `stats-vertical sm:stats-horizontal`
- Action button: stack below title on mobile

**Step 2: Verify** — Withdrawals page works on mobile and desktop.

**Step 3: Commit** — `refactor: withdrawals page responsive layout`

---

### Task 10: Improve Tables — Remove deprecated classes, add pin-rows

**Files:**
- Modify: `wow-admin-web/src/app/(dashboard)/deposits/DepositTable.tsx`
- Modify: `wow-admin-web/src/app/(dashboard)/withdrawals/WithdrawalTable.tsx`

**Step 1: In both table components**

Changes for both files:
- Remove `input-bordered` from search input (daisyUI 5 doesn't need it)
- Add `table-pin-rows` to `<table>` for sticky headers
- Wrap table in `<div className="overflow-x-auto max-h-[70vh]">` for scroll
- Use daisyUI `skeleton` for loading placeholders if applicable

**Step 2: Verify** — Tables scroll properly, headers stay pinned, search input styled correctly.

**Step 3: Commit** — `refactor: tables with daisyUI 5 classes and pin-rows`

---

### Task 11: Replace confirm() with ConfirmModal in WithdrawalTable

**Files:**
- Modify: `wow-admin-web/src/app/(dashboard)/withdrawals/WithdrawalTable.tsx`

**Step 1: Import ConfirmModal and add state management**

Add at top:
```tsx
import { ConfirmModal } from "@/components/ConfirmModal";
```

Add state:
```tsx
const [confirmState, setConfirmState] = useState<{
  open: boolean;
  type: "APPROVE" | "CANCEL";
  id: string;
}>({ open: false, type: "APPROVE", id: "" });
```

Replace `handleAction`:
```tsx
const requestAction = (type: "APPROVE" | "CANCEL", id: string) => {
  setConfirmState({ open: true, type, id });
};

const executeAction = () => {
  const { type, id } = confirmState;
  const label = type === "APPROVE" ? "승인" : "취소";

  startTransition(async () => {
    try {
      const res = await (type === "APPROVE" ? approveWithdrawal(id) : cancelWithdrawal(id));
      if (res.code === "1") {
        toast.success(`${label} 처리가 완료되었습니다.`);
      } else if (res.code === "VALIDATION_ERROR") {
        toast.error(res.message);
      } else {
        const path = type === "APPROVE" ? "/51400" : "/51600";
        toast.error(getLegacyErrorMessage(path, res.code));
      }
    } catch {
      toast.error(`${label} 중 통신 오류가 발생했습니다.`);
    } finally {
      setConfirmState({ open: false, type: "APPROVE", id: "" });
    }
  });
};
```

Update button onClick: `handleAction("APPROVE", id)` → `requestAction("APPROVE", id)`

Add modal before closing `</div>`:
```tsx
<ConfirmModal
  open={confirmState.open}
  title={confirmState.type === "APPROVE" ? "출금 승인 확인" : "출금 취소 확인"}
  message={confirmState.type === "APPROVE"
    ? "해당 출금 건을 승인하시겠습니까? 승인 후 즉시 이체가 진행됩니다."
    : "해당 출금 건을 취소하시겠습니까? 취소된 건은 복구할 수 없습니다."}
  confirmLabel={confirmState.type === "APPROVE" ? "승인" : "취소 처리"}
  variant={confirmState.type === "APPROVE" ? "primary" : "error"}
  loading={isPending}
  onConfirm={executeAction}
  onCancel={() => setConfirmState({ open: false, type: "APPROVE", id: "" })}
/>
```

**Step 2: Also replace confirm() in withdrawal apply page**

In `withdrawals/apply/page.tsx`, replace `if (!confirm(...)) return;` with same ConfirmModal pattern.

**Step 3: Verify** — Click approve/cancel shows modal dialog, confirm/cancel works.

**Step 4: Commit** — `refactor: replace confirm() with daisyUI ConfirmModal`

---

### Task 12: Polish Login Page

**Files:**
- Modify: `wow-admin-web/src/app/(auth)/login/page.tsx`

**Step 1: Use daisyUI fieldset, validator, and loading state**

Replace form section:

```tsx
<form action={formAction} className="space-y-4">
  <fieldset className="fieldset">
    <legend className="fieldset-legend">아이디</legend>
    <input
      name="username"
      type="text"
      required
      autoComplete="username"
      className="input validator w-full"
      placeholder="운영자 ID"
    />
    <p className="validator-hint">아이디를 입력하세요</p>
  </fieldset>

  <fieldset className="fieldset">
    <legend className="fieldset-legend">비밀번호</legend>
    <input
      name="password"
      type="password"
      required
      autoComplete="current-password"
      className="input validator w-full"
      placeholder="비밀번호"
    />
    <p className="validator-hint">비밀번호를 입력하세요</p>
  </fieldset>

  {state?.error && (
    <div role="alert" className="alert alert-error alert-soft">
      <span className="text-sm font-semibold">{state.error}</span>
    </div>
  )}

  <button type="submit" disabled={isPending} className="btn btn-primary btn-block mt-2">
    {isPending && <span className="loading loading-spinner loading-sm" />}
    {isPending ? "로그인 중..." : "로그인"}
  </button>
</form>
```

**Step 2: Verify** — Login page shows proper validation hints, loading spinner on submit.

**Step 3: Commit** — `refactor: login page with daisyUI fieldset and validator`

---

### Task 13: Final cleanup and apply page polish

**Files:**
- Modify: `wow-admin-web/src/app/(dashboard)/withdrawals/apply/page.tsx`

**Step 1: Replace `input-bordered` and `select-bordered` with daisyUI 5 equivalents**

In the apply page, remove all instances of `input-bordered` and `select-bordered` (not needed in daisyUI 5 — inputs have borders by default).

**Step 2: Use fieldset pattern for form groups**

**Step 3: Verify** — Apply form renders correctly, all inputs styled.

**Step 4: Commit** — `refactor: withdrawal apply form with daisyUI 5 patterns`

---

### Task 14: Final verification and build

**Step 1: Run** `npm run build` in `wow-admin-web/` — expect clean build with no errors.

**Step 2: Run** `npm run lint` — expect no lint errors.

**Step 3: Visual check** — All pages (login, dashboard, deposits, withdrawals, apply).

**Step 4: Commit** — `chore: final cleanup for daisyUI 5 redesign`
