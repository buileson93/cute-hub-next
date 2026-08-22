# Plan: Performance Optimization & UI Reliability (Phase 10X)

Optimize infinite scrolling performance using Keyset Pagination, tune virtualization parameters, restore persistent column controls, and establish regression testing.

## User Review Required

> [!IMPORTANT]
> - **Visual Text Update**: Updating the debug comment in `src/routes/__root.tsx` to track the current implementation goals.
> - **Data Loading**: Reducing page size from 200 to 100 rows to improve initial TTFB and reduce memory pressure on deep scrolls.
> - **UI Persistence**: Ensuring the "Column Visibility" menu remains accessible during state transitions (tab switching) and deep scrolling.

## Technical Details

### 1. Visual Text Update
- Update `src/routes/__root.tsx` line 164 with the new status text provided by the user.

### 2. Server-Side Keyset Pagination Tuning
- **File**: `src/components/mirats/ThanhPhanTable.tsx`
- **Action**: Change `kichThuoc` (Page Size) from `200` to `100` in `useInfiniteThanhPhanRows` and `useInfiniteTaiSanRows`.
- **Reason**: Smaller chunks reduce the payload size and the time spent by the browser processing large JSON responses, improving perceived smoothness during rapid scrolling.

### 3. Virtualization Optimization
- **File**: `src/components/mirats/StandardTable.tsx` & `src/components/mirats/DataTableCore.tsx`
- **Action**:
    - Standardize `overscan: 10` (from 15/12). Too high overscan causes rendering lag; too low causes "white flashes". 10 is a sweet spot for 100-row chunks.
    - Ensure `getItemKey` is implemented in `StandardTable` to prevent unnecessary DOM re-renders when rows are updated or prepended.
    - Verify `estimateSize` matches actual CSS row heights (`h-9` for compact = 36px, `h-11` for comfort = 44px).

### 4. UI Control Restoration
- **File**: `src/components/mirats/StandardTable.tsx`
- **Action**: 
    - Move the "Column Visibility" dropdown trigger into a dedicated `ToolbarActions` sub-component that uses `memo` to prevent re-renders when the table data updates.
    - Ensure `tableKey` is correctly passed from `ThanhPhanTable` to `StandardTable` to maintain column visibility state when switching between "Theo tài sản" and "Theo thành phần" tabs.
    - Fix potential layout shift in the toolbar that might cause buttons to overflow or disappear on smaller viewports.

### 5. Regression Testing
- **File**: `tests/performance/table-reliability.spec.ts`
- **Action**: Create a Playwright script that:
    1. Navigates to `/he-thong/thanh-phan`.
    2. Verifies the "Column Visibility" button is present.
    3. Scrolls down to trigger infinite loading.
    4. Verifies the header stays sticky.
    5. Switches tabs and verifies column preferences persist.

## Verification Plan

### Automated Verification
- Run `npm run test:e2e` (if available) or the specific Playwright script.
- Monitor console for "hydration mismatch" or "virtualization warning" errors.

### Manual Verification
- Scroll 500+ rows in both "Theo tài sản" and "Theo thành phần" modes.
- Toggle 3-4 columns, switch tabs, and return to verify they are still hidden/shown.
- Check mobile view (390px) to ensure the toolbar buttons are accessible.
