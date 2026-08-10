# Plan - T40: Hide code labels in Tree and MindMap views

To reduce visual noise and prioritize structural information, code labels (using `CodeBadge`) will be removed from the main display in the System Tree and MindMap views. These labels will be moved to tooltips visible on hover.

## Confirmation of Step 1

> [!IMPORTANT]
> I confirm the mechanism: in `CayMindMap.tsx`, the code label has `shrink-0` (line 194), while the name label (`TruncatedNodeLabel`, line 195) is allowed to truncate within its `min-w-0 flex-1` container. This means when space is tight, the code is preserved while the name is cut off.

## Phase 1: MindMap (CayMindMap.tsx)
- Remove `<CodeBadge code={data.code} />` from the `MindNode` render (line 194).
- Update `TruncatedNodeLabel` to accept an optional `code` prop.
- Modify its `Tooltip` logic: if `code` is provided, the tooltip should *always* be enabled (not just when truncated) to show the code alongside the label.
- Format: "Name (Code)" or similar in the tooltip.

## Phase 2: Tree Views (he-thong-cay/TreeView.tsx & so-ly-lich/TreeView.tsx)
### System Tree (he-thong-cay/TreeView.tsx)
- Remove `<CodeBadge code={d.tb.ma_thiet_bi} />` (line 101).
- Wrap the name `<span>` (line 100) in a `Tooltip` that shows the code.

### History Tree (so-ly-lich/TreeView.tsx)
- Remove `<CodeBadge code={d.ma_thiet_bi} />` (line 86).
- Wrap the `<Link>` (lines 87-93) or its inner content in a `Tooltip` that shows the code.
- Verify the link to the detail page still works (it will, as the `Link` component is preserved).

## Phase 3: Review of other locations

| Location | Purpose | Code Utility | Recommendation |
| :--- | :--- | :--- | :--- |
| `CatalogTable.tsx:860` | Main catalog list | Primary identifier | **KEEP / LINKED TO TOGGLE**. Already linked to `hideCode`. |
| `CatalogTable.tsx:1344` | Catalog merge/selection | Identification | **KEEP / PROPOSED TOGGLE**. Should probably follow `hideCode` or similar logic. |
| `ThanhPhanTable.tsx:621` | Tooltip/Cell for installed asset | Context | **HIDE**. Move to tooltip on name. |
| `ThanhPhanTable.tsx:1151` | Asset installation picker | Identity check | **KEEP**. Critical for confirming which serial/ID is being installed. |
| `ThietBiDetailDrawer:244` | Detail header | Official record | **KEEP**. This is the source of truth view. |

### Note on CatalogTable (Line 860)
The logic `row.ma && !hideCode && <CodeBadge code={row.ma} />` is ideal. It honors a `hideCode` prop (derived from column preferences). I will check if line 1343 missed this check.

## Verification Plan
- **MindMap**: Verify button names are longer and codes appear in tooltips.
- **Tree View**: Verify codes are gone from the line but visible on hover.
- **Navigation**: Click names in History Tree to ensure navigation still works.
- **Search**: Search for a code in System Tree and verify the node is highlighted.
- **Build**: Run `npx tsc --noEmit` and `npm run test`.
