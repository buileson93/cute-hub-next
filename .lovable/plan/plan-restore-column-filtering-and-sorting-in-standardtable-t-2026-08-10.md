# Plan: Restore Column Filtering and Sorting in StandardTable.tsx

Restore column-based filtering and sorting in `src/components/mirats/StandardTable.tsx` by adapting logic from a previous version (commit `f2663ffb4a514eff1eb431030fb69b549484f176`).

## Verification of Current State (Step 0)
- **Confirmed**: Grep results show `c.filter`, `c.sortable`, and `c.sortValue` are only present in interface definitions and property accessors, but not used in the rendering or logic of `StandardTable.tsx`.
- **Finding**: The current implementation lacks the logic to handle these properties.

## Investigation & Preparation
- **Normalize Function**: Found at `src/lib/mirats/global-search.ts`.
- **Git History**: Retrieved the old 954-line version of `StandardTable.tsx` from commit `f2663ffb4a514eff1eb431030fb69b549484f176`.
- **Mechanism Review**: The "smart" `catValues` logic uses `matchesFilters(r, c.key)` which applies filters from all columns *except* the one being calculated. This ensures the filter options only show values that would yield results given other active filters.

## Implementation Details (Scope: `src/components/mirats/StandardTable.tsx`)

### 1. State and Logic Restoration
- Add `catFilters` and `textFilters` state.
- Implement `matchesFilters` (with `exceptKey` support).
- Implement `catValues` using `useMemo` (includes Vietnamese locale sorting).
- Implement `cycleSort` and `sorted` logic (using `localeCompare` with "vi" and `numeric: true`).
- Restore the `ColFilter` internal component.
- Integrate `normalize` from `@/lib/mirats/global-search`.

### 2. UI Restoration
- Attach `ColFilter` to `TableHead` cells.
- Update header to handle sorting (click on label) vs filtering (click on funnel).
- Use `stopPropagation` on the funnel button to prevent triggering sort.
- Add active filter indicator (colored funnel icon).

### 3. Enhancements
- **Badge Counts**: Update `catValues` logic to return an object with counts: `{ value: string, count: number }[]`.
- **Filter Bar**: Add a row above the table showing active filters with 'x' to remove and a "Clear all" button.
- **Empty State**: Differentiate between "No data" and "No results matching filters".

### 4. Safety Checks (Doubts a-f)
- **a. Pagination**: Filters will run *before* `rowVirtualizer` or any client-side slicing. Server-side pagination is currently a concern; I will check if `pagination` prop is used for server-side fetching in known callers.
- **b. Bulk Actions**: `filteredRows` will be updated to pass the results of `matchesFilters`.
- **c. Export**: Currently `exportCols` uses `rows`. I will propose changing this to `filteredRows` but will verify if users expect a full export vs a filtered export first (as per instructions).
- **d. requireFilterToShow**: This logic exists in the old version and will be restored (defaulting to empty until first filter).
- **e. External Search**: Ensure `matchesFilters` is combined with external search results if present (logical AND).
- **f. Persistence**: No persistence for filters in this iteration (localStorage only for column visibility).

## Verification Plan
1. Run `npx tsc --noEmit` to ensure type safety.
2. Run `npm run test` to verify no regressions in `StandardTable.test.tsx`.
3. Manual testing on:
   - System Tree (Cây hệ thống)
   - Equipment List (Danh sách thiết bị)
   - Catalog (Danh mục)
4. Verify unaccented search ("he thong" -> "hệ thống").
