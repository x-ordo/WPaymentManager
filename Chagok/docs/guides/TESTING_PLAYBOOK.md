# Testing Playbook

This playbook documents the fast/slow test split, a single-module TDD starter set,
and the minimal staging smoke checks.

## 1) Fast vs slow commands

Backend:
- Fast: `make test-backend-fast`
- Fast (parallel): `make test-backend-fast-parallel`
- Slow/integration: `make test-backend-slow`
- Diff coverage gate: `make test-backend-diff-cover`

AI Worker:
- Fast: `make test-ai-worker-fast`
- Fast (parallel): `make test-ai-worker-fast-parallel`
- Slow/integration: `make test-ai-worker-slow`

Frontend:
- Fast (unit/integration): `make test-frontend-fast`
- Slow (staging E2E): `make test-frontend-slow`
- Storybook: `npm run storybook`
- Storybook test runner: `npm run test:storybook` (run after starting Storybook)

Staging E2E base URL:
- Default: `https://dpbf86zqulqfy.cloudfront.net/`
- Override: `PLAYWRIGHT_BASE_URL=... npm run test:e2e:staging`

Pytest randomization:
- Seed is randomized on each run (via `pytest-randomly`).
- Reproduce a run with `PYTEST_RANDOMLY_SEED=<seed> pytest ...`

Diff-cover tuning:
- Base branch: `DIFF_COVER_BASE=origin/main make test-backend-diff-cover`
- Minimum diff coverage: `DIFF_COVER_MIN=80 make test-backend-diff-cover`

## 2) TDD starter set (single module)

Module: `frontend/src/hooks/useMessages.ts`
Suggested test file: `frontend/src/__tests__/hooks/useMessages.websocket.test.ts`

Start with one test at a time (Red -> Green -> Refactor). Order:
1) Initializes with `wsError = null` and `isConnected = false`
2) Sets `wsError` on `ws.onerror`
3) Clears `wsError` when `ws.onopen` fires
4) Schedules reconnect on `ws.onclose`
5) Ignores messages for other `case_id`

Note: Keep each test focused on one behavior. Avoid combining UI state with websocket
parsing in a single test.

## 3) Staging smoke E2E (minimal)

Test file: `frontend/e2e/smoke.staging.spec.ts`
Coverage:
- Landing page renders critical sections (`data-animate="hero"`, `data-animate="pricing"`)
- Login form renders (email, password, submit)
- Signup form renders (name, email, role select, submit)

Run:
- `npm run test:e2e:staging`
- or `make test-frontend-slow`
