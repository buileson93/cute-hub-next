# Plan: Fix MindMap Visibility and Layout

The MindMap (Sơ đồ) tab in the System Tree page is currently invisible (rendering with 0px height) because the `DataState` wrapper loses the `h-full` class in its success state and its parent container (`PageBody`) lacks a flex layout to properly pass down height to absolute-positioned children like React Flow.

## User Review Required

> [!IMPORTANT]
> The "Sơ đồ" tab is present in the UI but appears empty because its height is not correctly calculated by the browser. I will fix the layout to ensure it fills the available screen space.

## Proposed Changes

### 1. DataState Component

- Modify `src/components/mirats/DataState.tsx` to wrap the `success` state children in a `div` if a `className` is provided. This ensures that layout classes like `h-full` or `flex-1` are not lost when the data finishes loading.

### 2. System Tree Route

- Update `src/routes/_app.he-thong.cay.tsx` to wrap the `CayMindMap` component in a `div` with `h-full`, matching the pattern used for the `TreeView`.
- Ensure the `DataState` wrapper is correctly configured to fill the `PageBody`.

### 3. MindMap Component

- Refine the `fitView` logic in `src/components/mirats/he-thong-cay/CayMindMap.tsx` to ensure it triggers once the container has valid dimensions.
- Adjust initial zoom and centering to provide a better overview of the 800+ assets.

## Technical Details

- **Height Fix**: React Flow requires its parent container to have a non-zero height. I will ensure the path from `PageBody` -> `DataState` -> `CayMindMap` preserves the `h-full` property.
- **DataState Update**: `DataState` currently returns a React Fragment in success mode, which discards the `className` prop. I will change it to return a `div` when `className` is present.
- **FitView Timing**: I will add a `ResizeObserver` or use React Flow's internal hooks to trigger `fitView` once the container dimensions are reported as non-zero.

## Verification Plan

### Automated Tests

- Run `npx tsc --noEmit` to ensure type safety.
- Use a Playwright script to verify:
  1. Navigation to `/he-thong/cay`.
  2. Switching to the "Sơ đồ" tab.
  3. Checking that the `.react-flow` element has a non-zero height.
  4. Checking that `react-flow__node` elements are present in the DOM.

### Manual Verification

- Verify the MindMap displays correctly in the preview at `/he-thong/cay`.
- Confirm that the "Recenter" button works as expected.
