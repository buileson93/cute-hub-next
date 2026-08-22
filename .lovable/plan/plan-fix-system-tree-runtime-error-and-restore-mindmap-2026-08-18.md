# Plan: Fix System Tree Runtime Error and Restore MindMap

The user is experiencing a recurring "This page didn't load" error on the System Tree (`/he-thong/cay`) route, and reports that the MindMap is not displaying data correctly despite being interactive. This suggests a failure in the data transformation or rendering pipeline where UI changes might have introduced logic bugs.

## Proposed Changes

### 1. Robust Error Isolation and Debugging

- Enhance `errorComponent` in `src/routes/_app.he-thong.cay.tsx` to capture and display more granular error context.
- Add specificErrorBoundary to `CayMindMap` to prevent a single node rendering failure from crashing the entire flow.

### 2. Data Pipeline Hardening

- **`buildTree` Guarding**: Add comprehensive null checks and type-safety to `buildTree` in `src/components/mirats/he-thong-cay/utils.ts` to handle cases where taxonomy or devices might contain unexpected `null` values or orphaned IDs.
- **MindMap Node Generation**: In `src/components/mirats/he-thong-cay/CayMindMap.tsx`, wrap the recursive `pushSystem` and node/edge generation logic in `try-catch` blocks.
- **Data Synchronization**: Ensure `viewTree` and `tree` are correctly memoized and that `CayContext` updates don't trigger infinite render loops.

### 3. MindMap Rendering Fixes

- Fix the issue where MindMap might show 0px height or empty content if the parent container doesn't provide a stable dimension.
- Ensure `ReactFlow` instance is properly initialized before attempting to zoom or fit view.
- Fix logic where `isFiltering` or search states might be incorrectly hiding all nodes.

### 4. UI Contrast and Consistency (Visual Fixes)

- Audit `MindNode` styling in `CayMindMap.tsx` to ensure system blue/primary tokens are used instead of low-contrast gray/white combinations as requested.
- Update `TruncatedNodeLabel` and `MindNode` tooltips to use high-contrast variants.

## Technical Details

- **File: `src/components/mirats/he-thong-cay/utils.ts`**:
  - Add default values for all properties in `buildTree`.
  - Handle `devices` being undefined or not an array.
- **File: `src/components/mirats/he-thong-cay/CayMindMap.tsx`**:
  - Wrap the main `useMemo` for `nodes` and `edges` in a `try-catch` that returns a single "Error" node if tree parsing fails.
  - Check if `tree` is empty before starting recursion.
  - Use `useLayoutEffect` or `useEffect` with small timeouts for `fitView` to ensure the canvas has dimensions.
- **File: `src/routes/_app.he-thong.cay.tsx`**:
  - Add a `loading` state check before passing data to child components.
  - Improve the `errorComponent` UI to match the requested "Đã xảy ra lỗi ở trang Cây Hệ thống" text.

## User Review Required

> [!IMPORTANT]
>
> - Are there specific filters or search terms that consistently trigger the "This page didn't load" error?
> - Does the error happen immediately upon page load or only after interacting with the MindMap tabs?
