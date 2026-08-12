# Plan - Restore System Tree MindMap

The System Tree MindMap is currently not rendering nodes correctly or is hard to see upon opening. This plan follows the 11-step restoration process from the user instructions.

## Verification Phase (Phase 1)

### Step 1: MindMap Component Audit (src/components/mirats/he-thong-cay/CayMindMap.tsx)
- **(a) Node delivery**: Currently, nodes are recalculated in a `useMemo` (lines 316-479) and then set in a `useNodesState` via `useEffect` (lines 482-483). This matches "đổ vào sau qua một hiệu ứng phụ".
- **(b) Frame centering (fitView)**: There is **no logic** to call `fitView()` automatically when nodes change. The `fitView` prop is present on the component but not triggered on data changes.
- **(c) Zoom limits**: `minZoom={0.05}` and `maxZoom={1.5}` are present (line 514-515).
- **(d) Dotted background**: **No** `<Background variant={BackgroundVariant.Dots} />` is present.
- **Confirmation**: Predictions (a), (b), (c), and (d) are confirmed.

### Step 2: Initial Expansion State
- Initial state is `new Set(["root"])` (line 278). Only the root node is open by default.

### Step 3: Layering Algorithm
- The `place` function (lines 414-441) processes nodes from the `Raw` tree. The `tree` data passed to the component contains the full structure, but the `expanded` set determines which branches are visible in the UI. Currently, the UI hides children if the parent is not in `expanded`.

### Step 4: Comparison with Legacy Implementation
- The legacy implementation used a delayed `fitView` inside an effect monitoring the node count.

### Step 5: Data Pagination Verification
- **Query Audit**: `src/routes/_app.he-thong.cay.tsx` (lines 158-199) **already implements** a `fetchAll` loop with `.range()` to fetch all records.
- **Database Count**: `public.thiet_bi` has **832** records, which is under the 1,000 limit, but the pagination logic is already safe.

---

## Implementation Phase (Phase 2)

### Step 6: Automatic Frame Centering
- Add a `useEffect` monitoring `nodes.length`.
- Call `fitView({ duration: 400, padding: 0.2 })` with a small `setTimeout` (approx 80-100ms) to allow the canvas to measure node dimensions.

### Step 7: Zoom Bounds Adjustments
- Keep `minZoom={0.05}` for large trees.
- Add `fitViewOptions={{ padding: 0.2 }}` to the `ReactFlow` component.

### Step 8: Initial Expansion (2-3 Tiers)
- Update the initial `expanded` state to include "root", all "pl:*" (Phân loại) nodes, and all "nh:*" (Nhóm hệ thống) nodes if the total node count remains manageable.
- Based on 832 assets, opening to the System (ht) level might be too much (>300 nodes). I will start by opening 2 levels (Phân loại & Nhóm hệ thống) by default.

### Step 9: Background Grid
- Add `<Background variant={BackgroundVariant.Dots} gap={12} size={1} />` from `@xyflow/react`.

### Step 10: Empty State UI
- Add a conditional check: if `rfNodes.length === 0` (excluding layer labels), render a centered "Chưa có dữ liệu" message with a reload button.

### Step 11: Data Completeness
- Verified Step 5: `thiet_bi` fetch is already using a loop. No changes needed to the query itself, but I will ensure `taxonomy` and `overrides` are also fully loaded.

## Technical Details

- **Files affected**:
  - `src/components/mirats/he-thong-cay/CayMindMap.tsx`: Main logic changes (Effects, Background, Empty state).
  - `src/routes/_app.he-thong.cay.tsx`: Minor verification (verified already correct).
- **Verification**:
  - `npx tsc --noEmit`
  - `npm run test`
