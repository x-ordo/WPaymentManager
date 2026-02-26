import { Suspense } from "react";
import { SidebarNav } from "../SidebarNav";
import { SidebarSummary, SidebarSummarySkeleton } from "../SidebarSummary";
import { HeaderUser, HeaderUserSkeleton } from "../HeaderUser";
import { KSTClock } from "@/components/KSTClock";
import { SidebarCloseButton } from "@/components/SidebarCloseButton";
import { LogoutButton } from "../LogoutButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="left-sidebar-drawer" type="checkbox" className="drawer-toggle" />

      {/* ── Main Content (drawer-content) ── */}
      <div className="drawer-content flex flex-col h-screen">
        {/* Navbar — sticky, always visible */}
        <div className="navbar sticky top-0 bg-base-100 z-10 border-b border-base-300 min-h-16 h-16 shrink-0 px-8">
          <div className="navbar-start">
            <label htmlFor="left-sidebar-drawer" className="btn btn-ghost btn-square drawer-button lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-5 w-5 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
          </div>
          <div className="navbar-center">
            <KSTClock />
          </div>
          <div className="navbar-end">
            <Suspense fallback={<HeaderUserSkeleton />}>
              <HeaderUser />
            </Suspense>
          </div>
        </div>

        {/* Page Content — variable outer padding based on design system */}
        <main 
          className="flex-1 overflow-y-auto bg-base-100 custom-scrollbar"
          style={{ padding: 'var(--outer-padding)' }}
        >
          {children}
        </main>
      </div>

      {/* ── Sidebar (drawer-side) ── */}
      <div className="drawer-side z-30">
        <label htmlFor="left-sidebar-drawer" aria-label="close sidebar" className="drawer-overlay" />
        <aside className="bg-base-100 border-r border-base-300 min-h-full w-64 flex flex-col items-stretch">
          {/* Mobile close button */}
          <SidebarCloseButton />

          {/* Logo — Right Aligned */}
          <div className="h-16 flex items-center justify-end pl-6 pr-2 border-b border-base-300 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-base font-black tracking-tight">Creative Payment</span>
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-primary-content">C</span>
              </div>
            </div>
          </div>

          {/* Account Summary */}
          <Suspense fallback={<SidebarSummarySkeleton />}>
            <SidebarSummary />
          </Suspense>

          {/* Navigation Menu — Fully stick to right edge */}
          <nav className="flex-1 py-4 pl-4 pr-0 overflow-y-auto custom-scrollbar flex flex-col items-end">
            <div className="text-sm font-medium text-base-content/20 pr-5 mb-3 uppercase tracking-widest text-right w-full">Menu</div>
            <SidebarNav />
          </nav>

          {/* Sidebar Footer — Logout */}
          <div className="p-4 border-t border-base-300 bg-base-100 flex justify-end">
            <LogoutButton />
          </div>
        </aside>
      </div>
    </div>
  );
}
