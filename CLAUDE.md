# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WOW Payment Manager (지급대행 관리 시스템) — a B2B intranet dashboard for managing withdrawals and deposits through a legacy payment gateway API. Built with Next.js 16 App Router as a full-stack application where Next.js acts as a BFF (Backend-For-Frontend).

## Repository Layout

```
PaymentManager/
├── wow-admin-web/          # Main Next.js application (all dev work here)
│   └── src/
│       ├── app/            # App Router pages (withdrawals/, deposits/, dashboard)
│       ├── actions/legacy.ts   # Server Actions — 11 functions mapping to 11 APIs
│       └── lib/legacy-api.ts   # Core API layer with auth, retry, mock support
├── docs/                   # Technical specs and implementation guides
│   └── 02_Specification/API_SPEC.md  # Canonical API reference (11 endpoints)
└── daisyui-admin-dashboard-template/ # Reference template (not production code)
```

## Commands

All commands run from `wow-admin-web/`:

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (v9 flat config)
```

No test framework is configured yet.

## Environment Variables

Create `wow-admin-web/.env`:
```
LEGACY_API_BASE_URL=http://127.0.0.1:33552
LEGACY_ADMIN_ID=master
LEGACY_ADMIN_PASS=649005
USE_MOCK_DATA=true
USE_HTTPS=false          # HTTPS 적용 시 true로 변경
```

Set `USE_MOCK_DATA=true` for development without the legacy API server.

## Architecture

### API-Only Design

All backend integration flows through a single pattern:

```
Page (Server Component) → Server Action (actions/legacy.ts) → fetchLegacy() (lib/legacy-api.ts) → Legacy HTTP API
```

- `fetchLegacy()` handles authentication, session caching (`globalConnectionId`), and automatic retry
- **401 (throttle)**: waits 5.1s, retries up to 3 times
- **402 (session drop)**: clears session, re-authenticates, retries
- All API calls use GET with query parameters; responses follow `{code, message, data?}` format
- Legacy API fields use underscore-prefixed naming: `_MONEY`, `_BANKUSER`, `_BANKNUMBER`, etc.

### Server vs Client Components

Pages are Server Components with `export const dynamic = "force-dynamic"` for fresh data. Only interactive table components (approve/cancel actions) use `"use client"`.

### 11 API Endpoints

| Code  | Purpose                    | Server Action              |
|-------|----------------------------|----------------------------|
| 10100 | Login (get connectionId)   | (handled internally)       |
| 21000 | Deposit applications       | getDepositApplications     |
| 30000 | Withdrawal notifications   | getWithdrawalNotifications |
| 40000 | Deposit notifications      | getDepositNotifications    |
| 50000 | Submit withdrawal          | applyWithdrawal            |
| 51000 | Withdrawal list            | getWithdrawalList          |
| 51100 | Search withdrawals         | searchWithdrawals          |
| 51400 | Approve withdrawal         | approveWithdrawal          |
| 51600 | Cancel withdrawal          | cancelWithdrawal           |
| 90000 | Balance & commission       | getBalanceInfo             |
| 90100 | Withdrawal limits          | getWithdrawalLimits        |

## Tech Stack & Configuration

- **Next.js 16.1.6** with React Compiler enabled (`reactCompiler: true` in next.config.ts)
- **React 19** with Server Components
- **TypeScript** strict mode, path alias `@/*` → `src/*`
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **ESLint v9** flat config with `eslint-config-next`
- No state management library — server data fetching + React state only

## Design System — "Calm Control"

Design tokens are defined in `globals.css` using Tailwind v4 `@theme` directives. Never use hardcoded hex colors — always use semantic token classes.

### Token Naming Convention

| Layer | Example Class | Purpose |
|-------|--------------|---------|
| Surface | `bg-surface-card`, `bg-surface-header` | Background colors by role |
| Ink | `text-ink-primary`, `text-ink-tertiary` | Text colors by hierarchy |
| Border | `border-border-default`, `border-border-subtle` | Border colors by weight |
| Status | `text-status-info`, `text-status-danger` | Functional color only |
| Button | `bg-btn-primary-bg`, `text-btn-ghost-text` | Interactive element colors |

### Key Rules

- **Color**: Grayscale only. Blue/Red/Green appear solely for status indicators, never decoration.
- **Typography**: `font-mono` + `tabular-nums` for all numeric/financial data. `font-sans` for labels.
- **Density**: Table rows 40–56px height. Minimal padding. Maximize visible records.
- **Corners**: Sharp (none to `rounded-sm`). This is a business tool, not a consumer app.
- **Animation**: `duration-fast` (100ms) for hover/focus. No bouncy or decorative motion.
- **Font sizes**: Use scale tokens (`text-2xs` through `text-3xl`). Never pixel literals like `text-[18px]`.
- **Language**: Korean throughout UI. English only for system identifiers.

### Design System Files

- `wow-admin-web/src/app/globals.css` — token definitions (source of truth)
- `wow-admin-web/.ui-design/design-system.json` — machine-readable token export
- `wow-admin-web/.ui-design/docs/design-system.md` — usage guide with component patterns

## Key Documentation

- `docs/02_Specification/API_SPEC.md` — the single source of truth for all API contracts
- `docs/01_Business/RFP.md` — business requirements and architecture decisions
- `docs/04_Implementation/02_Core_API_Module.md` — detailed API layer design and error recovery
