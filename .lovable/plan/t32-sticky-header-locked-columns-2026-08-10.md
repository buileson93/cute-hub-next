---
name: T32 — Sticky header and locked columns for StandardTable
description: Restore sticky behavior for table headers and specific columns (sticky: true) in the shared StandardTable component.
type: feature
---

# T32 — Sticky Header & Locked Columns

## Problem

The shared `StandardTable.tsx` lost its sticky header and column locking functionality during previous refactors. This makes large tables (like System Components) difficult to read as headers disappear on scroll and identifier columns (like names) disappear on horizontal scroll.

## Proposed Changes

### 1. `src/components/mirats/StandardTable.tsx`

- **Sticky Header**:
  - Add `sticky top-0 z-20` to `TableHead` elements in `TableHeader`.
  - Ensure background is opaque (use `bg-muted` or similar).
  - Add vertical borders between header cells: `border-r border-border/50 last:border-r-0`.
- **Sticky Columns**:
  - Implement logic to check `c.sticky` in both `TableHead` and `TableCell`.
  - Apply `sticky left-0 z-10 bg-card` (or appropriate opaque background) to sticky cells.
  - Handle the intersection (top-left corner):
    - If `selectable` is true, the checkbox column should likely be sticky by default or handle its `z-index`.
    - Sticky header + Sticky column intersection should have `z-30`.
- **Scrolling Container**:
  - Verify `max-h-[600px]` default value for `maxHeightClass`.
  - Ensure the `Card` wrapper has `overflow-auto`.

## Verification Plan

1. **Automated**: `npx tsc --noEmit` and `npm run test`.
2. **Visual Manual Check**:
   - `/he-thong/thanh-phan`: Check sticky header and locked "Tên" column (confirmed `sticky: true` exists in source).
   - `/su-co`: Verify sticky header on a medium table.
   - `/danh-muc/model`: Verify sticky header on a small table.
3. **Audit**: Confirm `maxHeightClass` default is sufficient.

## Constraints

- Do not modify `ui/table.tsx`.
- Do not change prop signatures.
- Maintain existing column filtering/ordering logic.
