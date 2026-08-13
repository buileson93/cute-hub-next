# Plan: Standardizing Entity Naming and Override Restoration

The user identified a critical regression where entity names (Systems, Groups, Types, Devices) are inconsistently read and written across three sources: database columns, `cay_node_edit.ten`, and `cay_node_edit.du_lieu.ten_mindmap`. The goal is to restore the "chaytot" convention: real records use database names (Single Source of Truth), and overrides are only for draft/manual nodes.

## Audit Results

### 1. Name Source Inventory (Reading)

| Entity Type | File:Line | Source Priority | Proposed |
|-------------|-----------|-----------------|----------|
| **Asset (tb)** | `db-taxonomy.ts:325` | `thiet_bi.ten_thiet_bi` | Keep (SSoT) |
| **System (ht)** | `db-taxonomy.ts:253` | `dm_he_thong.ten` | Keep (SSoT) |
| **Group (nh)** | `db-taxonomy.ts:265` | `dm_nhom_he_thong.ten` | Keep (SSoT) |
| **Draft Node** | `db-taxonomy.ts:468, 487` | `ten_mindmap` > `cay_node_edit.ten` | Restrict to draft-only |
| **Node Editor** | `NodeEditorSheet.tsx:65` | Props (`plLabel`, `nhLabel`, etc.) | Direct SSoT lookup |
| **Search** | `_app.he-thong.cay.tsx:352` | `d.tb.ten` (SSoT) | Keep |

### 2. Mutation Inventory (Writing)

| Feature | File:Line | Target | Auth | Audit | Proposal |
|---------|-----------|--------|------|-------|----------|
| **Rename** | `rename-entity.ts:73` | Generic `renameEntity` | No | No | Proposal logic |
| **Inline Edit** | `save-entity-securely.ts:16`| `saveEntityFieldSecurely` | Yes (RBAC) | Yes (CR) | Keep + Rename logic |
| **Add Group** | `mutations.ts:22` | `dm_nhom_he_thong` | Yes | No | Direct write |
| **Add System** | `mutations.ts:43` | `dm_he_thong` | Yes | No | Direct write |
| **Node Editor Save** | `NodeEditorSheet.tsx:194` | `renameEntity` / `saveCell` | Yes | Yes | Unified call |

### 3. Mismatch Conflicts
- **Problem**: `rename-entity.ts` does not clean up `cay_node_edit.ten` or `ten_mindmap` when updating a real entity.
- **Problem**: `NodeEditorSheet.tsx` has a separate `tenMindmap` field (lines 124, 126) that is currently orphaned (no save handler in `onClick` at line 194).
- **Data Anomaly**: 1 record found in `cay_node_edit` for `tb` with a non-null name that likely clashes with `thiet_bi.ten_thiet_bi`.

## Unified Naming Document (SSoT)

1. **Real Entities** (has UUID/Real ID):
   - **Name Source**: The specific `dm_*` or `thiet_bi` name column.
   - **Rule**: When renaming, update the database column. **Must delete** any existing record in `cay_node_edit` for this ID to ensure the override doesn't "re-appear".
   
2. **Draft Nodes** (User-created, no DB record):
   - **Name Source**: `cay_node_edit.ten`.
   - **Rule**: Store in `ten` column of `cay_node_edit`. Do not use `ten_mindmap` JSON field for the name itself.

3. **Writing Pipeline**:
   - All name updates must go through `saveEntityFieldSecurely`.
   - Admin = Direct Write + Override Cleanup.
   - KTV = Create `change_request`.

## Proposed Flow

```text
User Renames Node
       |
       v
saveEntityFieldSecurely(kind, id, field='ten', value)
       |
       |----[Kind Mapping]----> tb: thiet_bi.ten_thiet_bi
       |                       ht: dm_he_thong.ten
       |                       nh: dm_nhom_he_thong.ten
       |
       |----[Auth Check]------> Role: Admin?
       |                          |
       |                          |-- YES: 1. Update DB Table
       |                          |        2. DELETE FROM cay_node_edit WHERE ma=id
       |                          |
       |                          |-- NO:  1. createChangeRequest(loai, payload)
       v
   Refresh UI
```

## Implementation Plan

1. **Cleanup Query**:
   ```sql
   -- Run once to clean existing stale overrides
   DELETE FROM cay_node_edit e
   USING thiet_bi t WHERE e.kind = 'tb' AND e.ma = t.ma_thiet_bi;
   
   DELETE FROM cay_node_edit e
   USING dm_he_thong h WHERE e.kind = 'ht' AND e.ma = h.id::text;
   ```

2. **Modify `save-entity-securely.ts`**:
   - Add override cleanup logic for successful admin writes.
   - Ensure `ten` -> `ten_thiet_bi` mapping is robust for all kinds.

3. **Modify `NodeEditorSheet.tsx`**:
   - Link `tenMindmap` field to a save action if the node is a draft.
   - Hide the override field for real nodes to prevent confusion.

4. **Audit `rename-entity.ts`**:
   - Ensure it's not being called directly from UI, or wrap it with cleanup logic.
