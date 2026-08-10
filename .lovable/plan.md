# Plan: T34 — Robust Table Layout for Long Content

Fix table layout issues where long text (descriptions, serials, paths) breaks the structure by causing columns to expand excessively. Implement `table-layout: fixed` and safe defaults for text truncation while ensuring number alignment and role-based coloring.

## Proposed Changes

### 1. `StandardTable.tsx` - Layout & Text Handling
- **Enable `table-fixed`**: Update the `Table` component in `StandardTable` to use `table-fixed`.
- **Headings & Widths**: Apply `minW` property (if provided) to `TableHead` instead of just relying on content or `TableCell`.
- **Text Truncation Defaults**: For columns that don't have a custom `cell` renderer:
  - Add `truncate` (1 line) by default.
  - Add `title` attribute with the full text for hover preview.
  - Re-add break-word logic for strings without spaces: `[&_span]:break-words [overflow-wrap:anywhere] [word-break:break-word]`.
- **Numeric Alignment**: For right-aligned columns (`align: "right"`), add `tabular-nums`.
- **Inherited Background**: Restore light yellow background (`bg-amber-50/50`) for columns marked `inherited: true`.

### 2. `StdColumn` Interface Expansion
- Add `lineClamp?: number` (default 1) to `StdColumn`.
- Use this value to apply `line-clamp-{n}` classes in the default cell renderer.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` to check types.
- Run `npm run test src/components/mirats/__tests__/StandardTable.test.tsx`.

### Manual UI Verification
1. **Pages to check**:
   - `/he-thong/thanh-phan` (High column count: 41)
   - `/su-co`
   - `/bao-tri/cong-viec`
   - `/kiem-dinh`
2. **Check points**:
   - Verify columns don't explode with long text.
   - Hover over truncated text shows full content.
   - Numeric columns are perfectly aligned.
   - Inherited columns are visibly distinct (light yellow).
   - Check for "squashed" columns that become unusable under `table-fixed`.

### Report Requirements
- List where `minW` was applied.
- Confirm if moving `minW` to `TableHead` solved the fixed layout issue.
- Report on column usability across the 4 specified pages.
