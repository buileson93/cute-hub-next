# Plan - Restore MindMap/Diagram features and system data consistency

The project refactor incorrectly merged the paths for the automatic System MindMap and the manual Diagram Drawing tool. This plan restores the independent access to both features, fixes the expanded state seeding in the MindMap, and ensures the System Tree accurately reflects all systems even if they don't have associated devices.

## User Review Required

> [!IMPORTANT]
> - The "Diagram" menu in the sidebar will now point to `/so-do` (Manual Diagram Drawing) instead of the System MindMap.
> - The System MindMap remains accessible via the "Sơ đồ" tab within the `/he-thong/cay` page.

## Proposed Changes

### Navigation & Routing
- Restore the "Bản vẽ sơ đồ" menu item in `src/lib/mirats/nav-contract.ts` to point to `/so-do`.
- Ensure `/so-do` and `/so-do/$id` routes are fully functional as a manual diagramming tool using `GraphCanvas.tsx`.

### System MindMap (Automatic Tree)
- Fix the `expanded` state seeding logic in `src/components/mirats/he-thong-cay/CayMindMap.tsx` to prevent premature locking of the `seededRef`.
- Restore data completeness in `buildTree` within `src/routes/_app.he-thong.cay.tsx`:
    - Fetch and pass `realSystems` (from `taxonomy.htList`) to include systems without devices.
    - Pass order/color overrides from `cay_node_edit` (nhOrder, htOrder, ovColor).
    - Map systems to their managing units using `htDonViMap`.
- Add development-only console diagnostics in `CayMindMap.tsx` to monitor tree construction and node validity.

### Feature Integrity
- Ensure `onMoveGroup`, `onMoveSystem`, and `onMoveDevice` context menu actions are either connected to functional logic/dialogs or safely hidden, avoiding "fake" feedback (toast-only without saving).

## Technical Details

### 1. Navigation Fix
Modify `src/lib/mirats/nav-contract.ts`:
- Change `to: "/he-thong/cay?view=mindmap"` back to `to: "/so-do"`.
- Keep `label: "Bản vẽ sơ đồ"` and `icon: Waypoints`.

### 2. MindMap State Seeding
Update `src/components/mirats/he-thong-cay/CayMindMap.tsx`:
- Refactor the `useEffect` that seeds the `expanded` state to check `tree.length > 0` before setting `seededRef.current = true`.

### 3. Data Flow Restoration
In `src/routes/_app.he-thong.cay.tsx`:
- Construct `realSystems` from `taxonomy.htList`.
- Extract `nhOrder`, `htOrder`, and `ovColor` from the `overrides` query.
- Pass these to the `buildTree` utility.

### 4. Safety Checks
In `CayMindMap.tsx`:
- Add `console.debug` for counts and coordinate finiteness.
- Guard `fitView` against `NaN` positions.

### 5. Interaction Audit
Verify handlers in `TreeView` and `CayMindMap` components to ensure they aren't just empty stubs.

## Verification Plan

### Manual Verification
1. Navigate to `/so-do`:
    - Confirm the list of drawings appears.
    - Click "Sơ đồ mới" and verify creation.
    - Add/connect nodes and save; verify persistence after refresh.
2. Navigate to `/he-thong/cay` -> "Sơ đồ" tab:
    - Verify the tree renders from the root.
    - Confirm groups/systems appear even if they have zero devices.
    - Test expanding/collapsing nodes.
3. Check Browser Console:
    - Look for `[CayMindMap]` logs.
    - Verify `finiteNodes: true`.
    - Check that `treeCount > 0` if the database has systems.

### Automated Verification
- Run `npx tsc --noEmit` to ensure type safety.
- Run `npm run build` to verify the build process.
