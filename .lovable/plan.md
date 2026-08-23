# Plan - Phase 11H: Infinite Scroll Automation & E2E Integrity

Replace manual "Load More" with automatic scroll triggering while maintaining high-performance virtualization. Implement E2E tests to verify data consistency and record counts.

## Proposed Changes

### Roadmap & UI Text
#### [TopBar.tsx](src/components/mirats/app-shell/TopBar.tsx) & [TzClock.tsx](src/components/mirats/TzClock.tsx)
- Update tooltip and `aria-label` with the new Vietnamese roadmap text verbatim.

### Table Engine Optimization
#### [StandardTable.tsx](src/components/mirats/StandardTable.tsx)
- Remove the manual "Tải thêm dữ liệu" button.
- Refine the `useEffect` scroll trigger to be more responsive:
  - Trigger `fetchNextPage` when the last virtual item index is `>= display.length - threshold`.
  - Set `threshold` to a dynamic value (e.g., 10-15 rows) to ensure data is fetched before the user hits the absolute bottom.
  - Ensure the "loading lock" prevents duplicate requests during rapid scrolls.

### Data Integrity & Validation
#### [tests/table-integrity.test.py](tests/table-integrity.test.py)
- Expand the test suite to:
  - Verify that scrolling automatically triggers the next page load.
  - Assert that no duplicate IDs appear in the DOM after multiple loads.
  - Confirm the record count label (e.g., `100 / 1234`) updates accurately.

## Technical Details
- **Virtualization**: Continue using `@tanstack/react-virtual` with `translate3d` and `will-change-transform` for 60fps scrolling.
- **Debouncing**: Ensure search/filter still debounces correctly before triggering the initial keyset fetch.
- **E2E**: Use Playwright's `evaluate` to simulate scrolling and `locator.count()` to verify row additions.

## User Review Required

> [!IMPORTANT]
> The "Fetch All" button was removed in the previous phase to prioritize infinite scroll stability. This plan continues that direction by making infinite scroll fully automatic.
