# Plan - Restore MindMap Functionality and Fix Regression Bugs

Identify and fix critical issues in the System MindMap view to restore functionality, performance, and UI consistency as per the detailed bug report.

## User Review Required

> [!IMPORTANT]
>
> - The MindMap currently renders a blank canvas due to `NaN` transformations caused by missing layer node filtering.
> - Navigation state for the "System Tree" view is not persisted, causing UX frustration.
> - Search and filtering logic in the dashboard needs synchronization with the specialized MindMap view.

## Proposed Changes

### 1. Fix Canvas Blank Screen (Error 0)

- **File:** `src/components/mirats/he-thong-cay/CayMindMap.tsx`
- **Action:** Add filtering to `layerNodes` to ensure only layers with valid column positions (`COL[i]`) are rendered. This prevents `NaN` coordinates that break React Flow's viewport transformation.

### 2. Fix Frozen Expanded State (Error 1)

- **File:** `src/components/mirats/he-thong-cay/CayMindMap.tsx`
- **Action:**
  - Seed `expanded` state once when data is loaded using `useEffect` and `useRef`.
  - Include `"root-stopped"` in the default expanded set.
  - Initialize `useNodesState` with calculated `nodes` instead of an empty array.

### 3. Fix Layout & Overflow (Error 2)

- **File:** `src/routes/_app.he-thong.cay.tsx`
- **Action:** Apply `overflow-hidden` to the `PageBody` container specifically when `view=mindmap` to prevent scroll conflicts with React Flow's internal zoom/pan.

### 4. Fix Filtering Logic (Error 3)

- **File:** `src/routes/_app.he-thong.cay.tsx`
- **Action:**
  - Implement a proper `badgeFilterActive` check to avoid false positives on empty filter objects.
  - Fix the "Clear Search" button to actually reset `badgeFilter`.

### 5. Restore View Persistence (Error 4)

- **Files:** `src/routes/_app.he-thong.cay.tsx`, `src/components/mirats/he-thong-cay/CayContext.tsx`
- **Action:** Sync the `display` state with the URL search parameter `view` (valid values: `tree`, `mindmap`, `health`, `history`).

### 6. Connect Search to MindMap (Error 5)

- **File:** `src/components/mirats/he-thong-cay/CayMindMap.tsx`
- **Action:** Update the `useEffect` handling `focus` to automatically expand parent paths in the MindMap and center the view on the targeted node.

## Technical Details

- **React Flow Version:** `@xyflow/react`.
- **State Management:** TanStack Router Search Params for persistence; `CayContext` for cross-component coordination.
- **Verification:** Run `npx tsc --noEmit` and verify DOM transform values in browser console.
