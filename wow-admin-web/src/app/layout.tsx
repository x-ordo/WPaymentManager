import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { SidebarNav } from "./SidebarNav";
import { SidebarSummary, SidebarSummarySkeleton } from "./SidebarSummary";
import { HeaderUser, HeaderUserSkeleton } from "./HeaderUser";

export const metadata: Metadata = {
  title: "WowPaymentManager",
  description: "Payment Manager Intranet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex h-screen bg-surface-page text-ink-primary font-sans antialiased overflow-hidden">

        {/* Sidebar */}
        <aside className="w-60 bg-surface-sidebar border-r border-border-default flex flex-col shrink-0">
          {/* Logo */}
          <div className="h-14 flex items-center px-6 border-b border-border-default">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-xs font-bold text-ink-inverse">W</span>
              </div>
              <span className="text-sm font-bold tracking-tight text-ink-primary">Wow Payment</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
            <div className="text-2xs font-semibold text-ink-disabled px-3 mb-2 uppercase tracking-wider">메뉴</div>
            <SidebarNav />
          </nav>

          {/* Sidebar Footer — Account Summary (async, streamed) */}
          <Suspense fallback={<SidebarSummarySkeleton />}>
            <SidebarSummary />
          </Suspense>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top Bar */}
          <header className="h-14 bg-surface-card border-b border-border-default flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-success" />
              <span className="text-xs font-medium text-ink-muted tracking-wide">시스템 정상</span>
            </div>
            <Suspense fallback={<HeaderUserSkeleton />}>
              <HeaderUser />
            </Suspense>
          </header>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
