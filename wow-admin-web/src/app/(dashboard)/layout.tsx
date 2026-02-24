import { Suspense } from "react";
import { SidebarNav } from "../SidebarNav";
import { SidebarSummary, SidebarSummarySkeleton } from "../SidebarSummary";
import { HeaderUser, HeaderUserSkeleton } from "../HeaderUser";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" />

      {/* Main Content Area */}
      <div className="drawer-content flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <div className="navbar bg-base-100 border-b border-base-300 px-8 min-h-16 h-16 shrink-0">
          {/* Mobile hamburger */}
          <div className="flex-none lg:hidden">
            <label htmlFor="sidebar-drawer" className="btn btn-ghost btn-square">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-6 w-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </label>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-2 h-2 rounded-full bg-success" />
              <span className="text-sm font-medium text-base-content/40 tracking-wide">시스템 정상</span>
            </div>
          </div>
          <div className="flex-none">
            <Suspense fallback={<HeaderUserSkeleton />}>
              <HeaderUser />
            </Suspense>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Sidebar (drawer-side) */}
      <div className="drawer-side z-40">
        <label htmlFor="sidebar-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <aside className="bg-base-100 border-r border-base-300 w-64 flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-content">W</span>
              </div>
              <span className="text-base font-bold tracking-tight">Wow Payment</span>
            </div>
          </div>

          {/* Account Summary — prominent position */}
          <Suspense fallback={<SidebarSummarySkeleton />}>
            <SidebarSummary />
          </Suspense>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
            <div className="text-xs font-semibold text-base-content/30 px-3 mb-2 uppercase tracking-wider">메뉴</div>
            <SidebarNav />
          </nav>
        </aside>
      </div>
    </div>
  );
}
