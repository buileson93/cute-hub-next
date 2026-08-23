# Phase 11S: Unified Layout Architecture & E2E Validation

This plan enforces the "One Scroll Owner" principle across the entire catalog system and implements robust E2E testing to prevent future layout regressions.

## 1. Visual Text & A11y Update
Update `TzClock.tsx` and `TopBar.tsx` (via tooltip) with the new roadmap text as literal display content, replacing the existing layout/E2E description.

## 2. Layout Enforcement & Catalog Fixes
- **Standardize `CatalogTable.tsx`**: Ensure it strictly adheres to the `PageFrame` -> `PageHeader` -> `PageBody` pattern.
- **Fix `/danh-muc/vi-tri`**:
  - The current route uses a `Fragment` (`<>`) instead of being wrapped in a fixed-height layout.
  - Wrap the entire route component in `PageFrame`.
  - Ensure `CatalogTable` inside it doesn't try to manage its own `PageFrame` if it's already provided, or standardize `CatalogTable` to BE the frame provider.
  - Verification: `PageBody` must have `overflow-y-auto` and the page itself (`html`, `body`) must have `overflow: hidden`.

## 3. Playwright E2E Expansion
Enhance `tests/full-site-integrity.test.py`:
- **New Routes**: Add all catalog routes (`/danh-muc/loai-thiet-bi`, `/danh-muc/nha-san-xuat`, `/danh-muc/nha-cung-cap`, `/danh-muc/don-vi`, `/danh-muc/vi-tri`).
- **Sticky Check**: Verify `astryx-page-header` has `sticky` or `fixed` positioning and remains at `y=0` when scrolling content.
- **A11y Check**:
  - Assert existence of `[role="banner"]` (Header).
  - Assert existence of `[role="main"]` with `tabIndex="0"` (Body).
- **Multi-Resolution**: Run tests on both Desktop (1280px) and Mobile (375px) viewports to ensure `PageBody` scrolling works on touch devices.

## Technical details
- **Components**: `src/components/mirats/layout/PageFrame.tsx`, `PageHeader.tsx`, `PageBody.tsx`.
- **Target Route**: `src/routes/_app.danh-muc.vi-tri.tsx`.
- **Shared Template**: `src/components/mirats/CatalogTable.tsx`.
- **CSS**: Ensure `.mirats-scroll` (custom scrollbar) is applied correctly to `PageBody`.
