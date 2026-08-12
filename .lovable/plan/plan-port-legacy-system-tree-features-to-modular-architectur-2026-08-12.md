# Plan: Port Legacy System Tree Features to Modular Architecture (T17-T39 Regression & Restoration)

Port 13 critical features from the legacy monolithic system tree to the current modular structure while maintaining the module separation.

## User Review Required

> [!IMPORTANT]
> - All mutations will use the **Browser SDK** (`supabase`) and `useMutation` to respect RLS and permissions, as requested.
> - The `undoDelete` and `bulkSaveCell` features rely on a snapshot mechanism. We will leverage the `cay_thay_doi` table and `cay_hoan_tac` RPC if available, or implement a local client-side snapshot for instant undo.

## Proposed Changes

### 1. Data Context & Mutations (src/components/mirats/he-thong-cay)

#### `mutations.ts`
- Implement `useCayMutations` hook combining all requested operations:
    - `addGroup`: Insert into `dm_nhom_he_thong` with code collision check.
    - `addSystem`: Insert into `dm_he_thong` with auto-parent group creation and `phan_loai_id` inheritance.
    - `addDevice`: Direct asset insertion under a system.
    - `renameGroupCode`: Update `dm_nhom_he_thong.ma` and migrate `cay_node_edit` records.
    - `deleteNode`: Recursive deletion using `purge_thiet_bi` (for assets) and standard deletes for groups/systems, with preview logic.
    - `undoDelete` / `hoanTac`: Restore from snapshot using `cay_hoan_tac`.
    - `bulkSaveCell`: Multi-row update for assets with snapshot/undo support.
    - `reorderSiblings`: Save order to `cay_node_edit.du_lieu.thu_tu`.
    - `setNhColor`: Update group color in `cay_node_edit`.

#### `CayContext.tsx`
- Add shared states for:
    - `groupByLoai`: Toggle for grouping by asset type.
    - `reorgOpen`: State for the reorganization/undo dialog.
    - `pendingChanges`: Queue of applied but undoable actions.

#### `utils.ts`
- Restore `importCsv`, `buildCsv`, and `parseCsv` logic for tree structures.
- Update `buildTree` to support `groupByLoai` sorting/grouping.

### 2. UI Components (src/components/mirats/he-thong-cay)

#### `NodeEditorSheet.tsx`
- Connect `onAddGroup`, `onAddSystem`, `onRenameGroupCode`, and `onDelete` to the new mutations.
- Implement "Reorg" view to browse and undo recent changes.

#### `TreeView.tsx` & `CayMindMap.tsx`
- Restore full context menu actions:
    - Incident (`onIncident`), Maintenance (`onMaint`), History (`onHistory`).
    - Move Node (`onMoveGroup`, `onMoveDevice`).
- Ensure `useCan("he-thong", "manage")` guards all write actions.

### 3. Route Integration

#### `src/routes/_app.he-thong.cay.tsx`
- Connect route search params and context states to ensure full feature parity.

## Technical Details
- **Permissions**: Every mutation will verify `useCan("he-thong", "manage")`.
- **Invalidation**: `queryClient.invalidateQueries` will be called for `["cay_node_edit"]`, `["thiet_bi_cay"]`, and `["he_thong_thanh_phan_count"]`.
- **CSV Support**: Will use standard browser `Blob` and `a.click()` for export, and `FileReader` for import.
- **RPC Usage**: `purge_thiet_bi`, `cay_submit_change`, `cay_hoan_tac` from `supabase.rpc()`.
