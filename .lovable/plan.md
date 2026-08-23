# Plan: Fix System-wide Content Scrolling & Locked Layout Issues (Phase 11P)

The objective is to fix the "locked scroll" issue across the website while ensuring the AppShell (Sidebar, TopBar) remains fixed. Content inside `PageBody` should scroll independently without causing the entire page to scroll.

## User Review Required

> [!IMPORTANT]
> The fixes will be applied globally by standardizing `PageFrame`, `PageHeader`, and `PageBody` components. This ensures that every page following the new architecture (Astryx) will have a fixed header and scrollable body.

- **Check**: Are there any specific pages (other than Dashboard) where you *want* the entire page to scroll?
- **Behavior**: The Sidebar and TopBar will remain fixed at all times.

## Proposed Changes

### 1. Global CSS Optimization
- Update `.mirats-scroll` in `src/styles.css` to ensure it always forces a scrollbar container context if needed.
- Standardize height constraints for the main content area.

### 2. Standardizing Page Layout Components
- **PageFrame (`src/components/mirats/layout/PageFrame.tsx`)**: Ensure it takes full height (`h-full`) and enforces `flex flex-col overflow-hidden`.
- **PageHeader (`src/components/mirats/PageHeader.tsx`)**: Ensure it is truly sticky/fixed and has a high z-index.
- **PageBody (`src/components/mirats/PageBody.tsx`)**: Enable `overflow-y-auto` by default and apply the `mirats-scroll` class. This is the root cause: many pages were using `PageBody` with `overflow-hidden` or without proper scrolling behavior.

### 3. Fixing Dashboard & Overview specifically
- Update `src/routes/_app.tong-quan.tsx` and `src/components/mirats/dashboard/grid/DashboardGrid.tsx` to ensure they don't fight with the `PageBody` scroll.

### 4. AppShell Refinement
- Adjust `src/components/mirats/app-shell/AppShell.tsx` to ensure the `main` tag correctly contains the scrollable area without overflowing the viewport.

### 5. StandardTable Geometry
- Ensure `StandardTable.tsx` and `DataTableCore.tsx` correctly detect their parent container's scroll state to maintain sticky headers.

## Technical Details

- **PageFrame**: Change `h-full min-h-0` to `h-dvh flex flex-col overflow-hidden` (where appropriate).
- **PageBody**:
  - Remove `overflow-hidden`.
  - Add `overflow-y-auto mirats-scroll flex-1`.
  - Add `isolation: isolate` to prevent z-index issues with fixed headers.
- **AppShell**:
  - The `<main>` element needs `flex-1 min-h-0 overflow-hidden` to provide a stable height for its children (PageBody) to scroll.
- **Z-Index Strategy**:
  - Sidebar: `z-30`
  - TopBar: `z-20`
  - PageHeader: `z-10`
  - PageBody: `z-0`

## Verification Plan

### Automated Tests (Playwright)
- Create `tests/scroll-integrity.test.py`:
  - Navigate to `/tong-quan`, `/he-thong/thanh-phan`, `/he-thong/cay`.
  - Verify `PageHeader` position remains `y=44` (or TopBar height) after scrolling down.
  - Verify `PageBody` has `overflow-y: auto`.
  - Verify Sidebar doesn't move when scrolling content.

### Manual Verification
- Test on Mobile (Safari/Chrome) to ensure the bottom nav doesn't overlap scrollable content.
- Check "Search" results page scrolling.
- Verify "System Tree" (MindMap) zooming/panning isn't broken by parent scroll.
