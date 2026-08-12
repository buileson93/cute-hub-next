---
name: T33 — StandardTable Virtualization
description: Implement row virtualization in StandardTable using @tanstack/react-virtual to handle large datasets efficiently.
type: feature
---

# T33 — StandardTable Virtualization

## Problem
Currently, `StandardTable.tsx` renders all rows as DOM elements using `rows.map()`. For large datasets (e.g., 3000 rows with 27 columns), this creates >80,000 DOM elements, causing significant performance lag during scrolling and filtering.

## Verification & Baseline (Step 1)
- **Tool**: Playwright script to measure FPS while scrolling `/he-thong/thanh-phan`.
- **Measurement**: Report baseline FPS before any virtualization changes.
- **Decision**: If FPS is already ~60 and scrolling is smooth, virtualization will be deferred. However, given the "80,000 elements" estimation, it is likely necessary.

## Implementation Plan (Step 2)

### 1. `src/components/mirats/StandardTable.tsx`
- **Import**: `useVirtualizer` from `@tanstack/react-virtual`.
- **Virtualizer Setup**:
  - Target: The `Card` element with `overflow-auto` (the scroll container).
  - Count: `rows.length`.
  - Estimation: `estimateSize` set to a typical row height (e.g., 48px).
  - Measurement: Use `measureElement` for dynamic row heights as requested.
- **Rendering Logic**:
  - Replace `rows.map()` with `rowVirtualizer.getVirtualItems().map()`.
  - Wrap rows in a container that sets the total scrollable height using `rowVirtualizer.getTotalSize()`.
  - Position rows absolutely using `start` transform or use relative positioning with padding (Standard table layout usually requires the "padding" approach or absolute positioning within a container).
- **Sticky Header Sync**:
  - Ensure `sticky top-0 z-20` on `TableHeader` still works. Since virtualization usually replaces the `tbody` content, the `thead` should remain outside the virtualized list or be handled via the virtualizer's fixed headers support if needed.
- **Selection & State**:
  - Verify `toggleRow` uses IDs (it does). Since state is outside the DOM, virtualization will not lose selection.

## Verification Plan
1. **Performance**: Measure FPS after implementation and compare with baseline.
2. **Persistence**: Select rows, scroll away, scroll back, and verify selection remains.
3. **Export**: Verify CSV export still includes all rows, not just virtualized ones.
4. **Compatibility**: Verify sticky headers and sticky columns (T32) still function correctly.
5. **Quality**: `npx tsc --noEmit` and `npm run test`.

## Constraints
- Do not use fixed heights if `measureElement` can handle it.
- Keep Card/Mobile layout separate.
