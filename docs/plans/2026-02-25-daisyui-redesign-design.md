# WOW Admin Web — daisyUI 5 Comprehensive Redesign

**Date**: 2026-02-25
**Approach**: Evolutionary Upgrade (Approach A)

## 1. Theme Completion

Current `wowpay` theme is missing required daisyUI 5 variables. Complete all required fields:

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

Remove deprecated `input-bordered` classes (daisyUI 4). In daisyUI 5, inputs have borders by default.

## 2. Sidebar Redesign

**Current**: Custom right-aligned menu with manual rounded-l-2xl, excessive info density.
**Target**: Standard daisyUI `menu` with icons, cleaner summary.

- Use daisyUI `menu` component natively (no custom rounded/alignment hacks)
- Add SVG icons to each nav item (dashboard, withdrawal, deposit)
- Simplify `SidebarSummary`: show only balance + days remaining (move commission info to dashboard only)
- Use daisyUI `stats stats-vertical` for sidebar summary numbers

## 3. Confirm Modal

**Current**: Browser `confirm()` dialog for approve/cancel.
**Target**: daisyUI `modal` with HTML dialog element.

Create `ConfirmModal` component:
```
<dialog class="modal">
  <div class="modal-box">
    <h3>Title</h3>
    <p>Description</p>
    <div class="modal-action">
      <button class="btn">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
```

## 4. Toast System

**Current**: Custom ToastContainer implementation.
**Target**: daisyUI `toast` + `alert` positioned bottom-end.

```html
<div class="toast toast-end toast-bottom">
  <div class="alert alert-success">Message</div>
</div>
```

## 5. Table Improvements

- Remove `input-bordered` (daisyUI 4 deprecated)
- Add `table-pin-rows` for sticky headers on scroll
- Add `table-sm` option for compact mode
- Wrap tables in proper `overflow-x-auto` container
- Use daisyUI `badge` variants consistently (already mostly correct)

## 6. Responsive Layout

**Dashboard page**:
- Hero row: `grid lg:grid-cols-5 grid-cols-1 gap-6` (balance=3col, system=2col)
- Stats row: `stats-vertical sm:stats-horizontal`

**Deposits/Withdrawals pages**:
- Stats: `stats-vertical sm:stats-horizontal`
- Tab + title: stack vertically on mobile
- SearchFilter: stack vertically on mobile

## 7. Skeleton/Loading States

Replace custom `animate-pulse` divs with daisyUI `skeleton` component:
- `<div class="skeleton h-4 w-20"></div>` for text placeholders
- `<div class="skeleton skeleton-text">Loading...</div>` for text blocks

## 8. SearchFilter Improvements

- Use `type="datetime-local"` for proper date picker UX
- Use daisyUI `fieldset` + `fieldset-legend` for grouping
- Quick filter buttons: use daisyUI `filter` component (radio-based)

## 9. Login Page Polish

- Use daisyUI `fieldset` for form grouping
- Use daisyUI `validator` + `validator-hint` for error display
- Add `loading` spinner to submit button

## 10. Header Improvements

- Add daisyUI `dropdown` for user profile menu (with logout inside)
- Move LogoutButton from sidebar footer into header dropdown
- Cleaner mobile hamburger

## Files to Modify

1. `globals.css` — theme completion
2. `(dashboard)/layout.tsx` — sidebar + header restructure
3. `SidebarNav.tsx` — daisyUI menu with icons
4. `SidebarSummary.tsx` — simplified stats
5. `HeaderUser.tsx` — dropdown with logout
6. `LogoutButton.tsx` — move into header dropdown
7. `(dashboard)/page.tsx` — responsive grid
8. `deposits/page.tsx` — responsive stats
9. `deposits/DepositTable.tsx` — table improvements
10. `withdrawals/page.tsx` — responsive stats
11. `withdrawals/WithdrawalTable.tsx` — table + confirm modal
12. `SearchFilter.tsx` — datetime-local + fieldset
13. `(auth)/login/page.tsx` — fieldset + validator
14. New: `components/ConfirmModal.tsx`
15. Modify: `components/ToastContainer.tsx` → daisyUI toast pattern
