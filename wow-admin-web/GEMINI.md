# GEMINI.md - Project Instructions

This file serves as the foundational instructional context for Gemini CLI when working within the **WowPaymentManager** workspace.

## 🚀 Project Overview
**WowPaymentManager** is a high-density, B2B intranet administration system for payment processing. It is designed to replace legacy HTML-based tools with a modern, robust, and secure management interface.

- **Tech Stack**: Next.js 15+ (App Router), TypeScript, Tailwind CSS 4.
- **Architecture**: **API-First (BFF Pattern)**.
  - **No Direct DB Access**: All data operations must strictly go through the legacy API defined in `docs/02_Specification/API_SPEC.md`.
  - **Server Actions**: Frontend interacts with the backend solely via Next.js Server Actions (`src/actions/legacy.ts`).
  - **Core Communication**: `src/lib/legacy-api.ts` handles authentication, session recovery (402), and throttling (401).

## ⚠️ Critical Development Mandates

### 1. Backend Connectivity (API Only)
- **Direct Database Connection is strictly prohibited.**
- You must always use the `fetchLegacy` utility in `src/lib/legacy-api.ts` for any backend communication.
- The backend internal structure (tables, queries) is treated as a black box.

### 2. UI/UX Style (Minimalist & High-Density)
- **Visual Palette**: Strictly follow a **Soft Monochrome** strategy.
  - Primary Text: `#404040` (Dark Gray).
  - Secondary Text: `#737373` / `#A3A3A3` (Gray).
  - Background: `#FAFAFA`.
  - Avoid strong blacks (`#000`, `#1A1A1A`) and excessive colors.
- **Font Sizes**: All UI elements and text should be roughly **25% larger** than standard browser defaults to ensure maximum readability (mimicking a 125% zoom state).
- **Layout**: High-density tables (`h-[70px]` to `h-[84px]` rows) with strict alignment:
  - **Right**: Financial amounts.
  - **Center**: Status badges, IDs, Dates.
  - **Left**: Descriptive text, merchant info.

### 3. Next.js 15+ Conventions
- **Asynchronous Dynamic APIs**: `searchParams` and `params` are Promises. They **must be awaited** before accessing properties (e.g., `const { sdate } = await props.searchParams`).
- **Server Actions**: Ensure all data-modifying actions use `"use server"` and call `revalidatePath` to keep the UI in sync.

## 🛠️ Building and Running

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Run**: `npm run start`
- **Lint**: `npm run lint`

## 📂 Key File Structure
- `src/lib/legacy-api.ts`: Central communication engine with Mock/Session logic.
- `src/actions/legacy.ts`: All Server Action mappings for the 11 legacy APIs.
- `src/app/layout.tsx`: Global navigation and persistent asset summary sidebar.
- `src/app/withdrawals/`: Withdrawal management (Active/History tabs).
- `src/app/deposits/`: Deposit management (Applications/Notifications tabs).

---
*Follow these instructions rigorously to maintain architectural integrity and UI consistency.*
