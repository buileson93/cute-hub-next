# Plan: Phase 10N - Unified Table Scroll & Geometry

Fix blocked horizontal scrolling in tables, establish a single scroll owner, and ensure consistent geometry across all MIRATS table implementations (StandardTable, DataTableCore, RawTableWrapper).

## User Review Required

> [!IMPORTANT]
> This plan changes the core DOM structure of tables to support robust horizontal scrolling and virtualization.

- **Unified Scroll Behavior**: We are moving to a "Single Scroll Owner" model. A dedicated viewport div will handle all scrolling (horizontal and vertical), while an outer shell provides the borders and radius.
- **Column Geometry**: Total column widths will now determine the table's `min-width`, preventing columns from shrinking below readability limits.
- **Feature Parity**: "Reset Width" and "Auto-fit" buttons will be added to `StandardTable` to manage column preferences.

## Proposed Changes

### 1. Refactor Table CSS Architecture
- Update `src/styles/astryx-component-skins.css` to move `overflow: hidden` from `.astryx-table-container` to an "outer-shell" concept or change it to `overflow: clip`.
- Define semantic scroll tokens if needed to ensure consistency across light/dark modes.

### 2. Standardize `DataTableCore.tsx`
- Remove `block` and `flex` overrides on `Table`, `TableHeader`, and `TableRow` that conflict with native table layout.
- Use a single scrollable container (`containerRef`) for both horizontal and vertical scrolling.
- Ensure `min-width: 100%` and `width: max-content` (or calculated width) on the inner table element.
- Fix sticky cell positioning to work correctly with horizontal scroll offsets.
- Remove `active:scale` on `TableRow`.

### 3. Standardize `StandardTable.tsx`
- Refactor the component structure to:
  ```text
  [Outer Shell (borders, radius)]
    [Toolbar]
    [Scroll Viewport (overflow: auto, single scroll owner)]
      [Table (min-width: calculatedTotalWidth)]
        [Header (sticky)]
        [Body (virtualized)]
    [Footer/Pagination]
  ```
- Calculate `tableMinWidth` by summing:
  - Width of selection column (if enabled).
  - Width of expand column (if enabled).
  - Width of action column (if enabled).
  - User-saved widths or `minWidth` for each visible data column.
- Update `rowVirtualizer` to use the new Scroll Viewport as its scroll element.
- Add "Reset Width" and "Auto-fit" controls in the column settings dropdown.

### 4. Update `RawTableWrapper.tsx`
- Remove nested horizontal scrollbars by unifying the overflow rules.
- Ensure it respects the same "one scroll owner" principle as the other table components.

### 5. Enhancement to `table-geometry.ts`
- Ensure `calculateOptimalWidths` correctly handles all column types (taxonomy, user, status).

### 6. Verification & Tests
- **Geometry Test**: Verify `scrollWidth > clientWidth` when columns exceed viewport.
- **Sticky Test**: Verify header and sticky columns remain aligned during scroll.
- **Virtualization Test**: Verify record integrity after scrolling to the middle of a large list horizontally and vertically.
- **Accessibility**: Verify keyboard navigation (Tab/Arrows) within the scrollable viewport.

## Technical Details

- **Single Scroll Element**: In TanStack Virtual, `getScrollElement` must point to the *one* element that has the overflow.
- **Layout Model**: Use `table-layout: auto` for flexible sizing or `table-layout: fixed` with explicit widths. Phase 10N prefers `fixed` with aggregate `min-width` to ensure column precision.
- **Sticky Implementation**: Use `sticky left-[offset]` where `offset` is the cumulative width of preceding sticky columns.

## Verification Plan

### Automated Tests
- `bunx vitest tests/table-geometry.test.ts`
- Playwright script to check `scrollWidth` and `clientWidth` of `.mirats-scroll-viewport`.
- `ui:audit` to check for overflow violations.

### Manual Verification
- View `/thiet-bi/danh-sach` with 15+ columns on a 1024px screen.
- Verify horizontal scrollbar appears and tracks smoothly.
- Resize a column and check if total table width updates immediately.
- Switch between Density modes and check for layout breakage.
