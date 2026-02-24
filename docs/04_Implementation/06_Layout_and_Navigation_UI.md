# 미니멀 글로벌 레이아웃 (`src/app/layout.tsx`)

좌측에 얇은 Navbar를 배치하고 나머지 영역을 리스트에 할애하는 **콘텐츠 중심의 미니멀 레이아웃**입니다.

---

### 1. 디자인 구성
*   **Sidebar:** 최소한의 폭(200px 미만)과 옅은 경계선으로 구성. 화려한 아이콘 대신 텍스트 중심의 메뉴.
*   **Main Content:** 배경을 `#FAFAFA`로 설정하여 테이블(`white`)과의 시각적 대비를 줌.
*   **Color Usage:** 전체적으로 무채색(`Grayscale`)을 사용하여 데이터(숫자)에만 집중할 수 있게 함.

### 2. 구현 코드

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="flex h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans antialiased overflow-hidden">
        
        {/* Minimal Sidebar */}
        <aside className="w-48 bg-white border-r border-[#E5E5E5] flex flex-col shrink-0">
          <div className="h-14 flex items-center px-5 border-b border-[#E5E5E5]">
            <span className="text-sm font-black tracking-tighter">WOW ADMIN</span>
          </div>
          
          <nav className="flex-1 py-6 px-3 space-y-1">
            <Link href="/" className="block px-3 py-2 text-[13px] font-bold text-[#1A1A1A] hover:bg-[#F5F5F5] rounded-sm transition-colors">
              대시보드
            </Link>
            <Link href="/withdrawals" className="block px-3 py-2 text-[13px] font-bold text-[#1A1A1A] bg-[#F5F5F5] rounded-sm transition-colors">
              출금 승인 관리
            </Link>
          </nav>

          <div className="p-4 text-[10px] text-[#A3A3A3] font-mono border-t border-[#E5E5E5]">
            SYSTEM ONLINE (v1.0)
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header - Minimalist */}
          <header className="h-14 bg-white border-b border-[#E5E5E5] flex items-center justify-end px-6 shrink-0">
            <div className="text-[12px] font-bold text-[#737373]">관리자 세션: 활성</div>
          </header>

          {/* List Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-[1400px] mx-auto">
              {children}
            </div>
          </div>
        </main>

      </body>
    </html>
  );
}
```
