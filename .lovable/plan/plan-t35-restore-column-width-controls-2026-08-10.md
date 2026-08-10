# Plan: T35 — Restore Column Width Controls

Restore user ability to resize table columns, persisting preferences via `useColumnPrefs` and `useColumnWidths`.

## Phase 1: Investigation & Verification (COMPLETED)
- Checked `StandardTable.tsx`: Confirmed missing resize logic. `useColumnPrefs` is imported and used for visibility/order, but not widths.
- Checked `use-column-prefs.ts`: Currently only handles `order` and `hidden` (and `presetId`). It does NOT handle widths.
- Checked `use-column-widths.ts`: Exists but is disconnected from the main `StandardTable` and only uses `localStorage`.
- Checked `schema.sql`: `bang_cot_tuy_chinh.cau_hinh` is `jsonb`, which is perfect for adding a `widths` key without schema changes.

### Q&A from Stage 1:
a) **Do widths persist?** Currently, `useColumnWidths` only saves to `localStorage`. `useColumnPrefs` (which talks to DB) does not have a width field yet.
b) **DB Changes?** No. `bang_cot_tuy_chinh.cau_hinh` is `jsonb`. We just need to update the TypeScript `ColumnPrefs` type and the hook logic to include a `widths` object.
c) **Is useColumnPrefs "dead"?** I will verify this in the preview by toggling a column and refreshing. If it doesn't remember, I will fix the hydration/sync logic first.

## Phase 2: Implementation

### 1. Unified Storage
- Update `ColumnPrefs` type in `src/lib/mirats/use-column-prefs.ts` to include `widths?: Record<string, number>`.
- Modify `useColumnPrefs` to expose `widths` and `setWidth(key, width)`.
- (Optional but recommended) Deprecate/Merge `use-column-widths.ts` into `use-column-prefs.ts` to avoid dual-hook overhead and ensure DB sync for widths.

### 2. StandardTable UI Components
- **Column Header Resizer**:
    - Add a `div` resizer to each `TableHead`.
    - Handle `onMouseDown` for resizing.
    - Implement `onDoubleClick` to reset width.
    - Prevent `onClick` (sort) from firing when resizing (use `e.stopPropagation()` and a "isDragging" ref).
- **Column Controls**:
    - Add "Auto-fit" and "Reset all" buttons to the toolbar or header area (recovering logic from previous version).
- **Truncated Headers**:
    - Wrap header labels in `<span className="truncate">` with `title` for full view.

### 3. Virtualization Sync
- In `StandardTable.tsx`, call `rowVirtualizer.measure()` when widths change to ensure height calculations remain accurate if text wraps differently.

### 4. Verification
- `npx tsc --noEmit`
- `npm run test src/components/mirats/__tests__/StandardTable.test.tsx`

## Risks
- **Drag vs Sort Conflict**: Requires careful event management on `TableHead`.
- **Performance**: Rapid state updates during dragging. Use a temporary local state for the drag "ghost" or debounce the persistence call.
