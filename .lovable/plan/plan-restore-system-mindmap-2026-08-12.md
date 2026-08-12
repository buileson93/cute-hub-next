---
title: Restore System MindMap functionality and visibility
description: Fix layout, state synchronization, and React Flow rendering issues to ensure the System MindMap is visible and interactive.
---

# Plan - Restore System MindMap

The user is reporting that the MindMap is still not showing or nodes are not expanding properly. Previous attempts focused on layout and basic state, but there might be deeper issues with how React Flow handles the tree data or viewport initialization.

## User Review Required

> [!IMPORTANT]
> The MindMap depends on the "Cây" (Tree) data loading correctly. If you see "Không tìm thấy kết quả" (No results found) even without filters, the database might be empty or failing to fetch.

- **Check viewport height**: The container needs a specific height for React Flow to initialize.
- **Verify data propagation**: Ensure `viewTree` is correctly passed to `CayMindMap`.
- **Debug React Flow state**: Check if nodes have valid `x, y` coordinates.

## Proposed Changes

### Logic & State
#### [CayContext.tsx]
- Add `initialRender` ref to ensure `expandedNodes` is seeded only once when data first arrives, preventing resets during minor updates.

#### [CayMindMap.tsx]
- **Fix NaN transformation**: Filter out nodes that might have invalid coordinates before rendering.
- **Layout initialization**: Ensure `fitView` is called correctly after nodes are positioned.
- **Node Expansion**: Improve the `toggle` logic to persist user choices while respecting the search/focus automatic expansion.
- **Resize Handling**: Ensure the container responds to window resizing to prevent the 0px height bug.

### UI & Layout
#### [_app.he-thong.cay.tsx]
- Standardize the `PageBody` and `DataState` height to `h-full flex-1`.
- Ensure the `mindmap` tab container has `min-h-[600px]` to force a minimum visible area if parent flex fails.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` to verify type safety.

### Manual Verification
- Open `/he-thong/cay?view=mindmap`.
- Verify the canvas is not blank.
- Click `+` / `-` on nodes to expand/collapse.
- Use the search bar to find a node and verify the map centers on it.
- Check browser console for any "ResizeObserver" or "React Flow" errors.
