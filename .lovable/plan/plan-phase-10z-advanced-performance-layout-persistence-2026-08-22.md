# Plan - Phase 10Z: Advanced Performance & Layout Persistence

This phase focuses on extreme optimization for virtualization, ensuring UI state persistence (columns/tabs), and maximizing rendering efficiency for low-end devices.

## User Objectives
1. **Adaptive Virtualization**: Implement overscan and windowing that adapts to frame rate and device type for smoother infinite scrolling.
2. **Column/Tab Persistence**: Ensure column visibility and order remain unchanged when switching between "Theo tài sản" (Asset) and "Theo thành phần" (Component) tabs or changing datasets.
3. **Memoized Rendering**: Improve `DataTable` cell rendering using data-based memoization and standardized props to limit re-renders during fast scrolling.
4. **Visual Text Update**: Update the debug status text in `__root.tsx`.

## Technical Details

### 1. Adaptive Virtualization (DataTableCore & StandardTable)
- **Dynamic Overscan**: Implement a simple FPS-based overscan adjustment. If frames drop, reduce overscan to lower DOM node count; if frames are stable, increase overscan for smoother scrolling.
- **Scroll Throttling**: Optimize scroll event handling to prevent layout thrashing on weak devices.
- **Improved Windowing**: Fine-tune the intersection observer logic for infinite loading to be more aggressive on high-latency networks.

### 2. UI State Persistence (ThanhPhanTable & useColumnPrefs)
- **Unified tableKey**: Ensure both View Modes in `ThanhPhanTable` use a shared or clearly mapped `tableKey` so preferences persist across tab switches.
- **Refactor `useColumnPrefs`**: Ensure the hook correctly reconciles column keys when the dataset changes (e.g., swapping from Asset view columns to Component view columns) without losing the user's hidden/ordered state for common columns.
- **Tab State Persistence**: Ensure `viewMode` ("component" vs "asset") and `bucket` filters are saved to `user_pref` correctly.

### 3. Memoized Rendering (OptimizedCell & Rows)
- **Deep Memoization**: Update `OptimizedCell` to use a more robust comparison logic that specifically checks for value changes in the underlying data object rather than just shallow prop checks.
- **Standardized Cell Props**: Ensure all cells receive a stable `colKey` and `rowId` to prevent unnecessary unmounts.
- **CSS `will-change`**: Apply `will-change: transform` more selectively to avoid memory bloat on devices with limited VRAM.

### 4. Visual Edits
- Update `src/routes/__root.tsx` comment section with the new technical requirement text.

## Verification Plan
- **Performance Audit**: Use Playwright to measure scroll FPS on simulated "Slow CPU" profiles.
- **State Persistence Test**: 
    1. Hide a column in "Theo tài sản".
    2. Switch to "Theo thành phần".
    3. Switch back to "Theo tài sản" and verify the column is still hidden.
    4. Refresh page and verify state persists.
- **Regression Check**: Ensure column visibility menus still work and infinite scroll doesn't break at page boundaries.
