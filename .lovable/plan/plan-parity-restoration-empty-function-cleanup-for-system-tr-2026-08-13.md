# Plan: Parity Restoration & "Empty Function" Cleanup for System Tree

## Overview

Restore 100% behavior parity for the System Tree editor (`NodeEditorSheet.tsx`) across all views (Tree, Table, MindMap). This involves reconnecting disconnected "empty" parameters to real business logic and unifying the write pipeline through existing RPCs and context providers.

## Proposed Changes

### 1. Restore Unified Parameters mapping

The following parameters in `_app.he-thong.cay.tsx` will be reconnected to real logic:

| Parameter                    | Decision | Real Data Source / Action                                                       | UI Impact                                             |
| :--------------------------- | :------- | :------------------------------------------------------------------------------ | :---------------------------------------------------- |
| `saving`                     | **A**    | Derive from `renameEntity.isPending \|\| saveCell.isPending` in `mutations.ts`. | Spinner on Save button.                               |
| `unitCodeOf`                 | **A**    | Use `taxonomy.nhomNameMap` and `taxonomy.plNameMap` from `useDbTaxonomy`.       | Displays unit/group code in Sheet title.              |
| `isCustomNode`               | **A**    | Use `overrides` query to check if node exists only in `cay_node_edit`.          | Determines if "Thành phần hệ thống" manager is shown. |
| `isRealNode`                 | **A**    | Opposite of `isCustomNode` (exists in `thiet_bi`, `dm_he_thong`, etc.).         | Controls visibility of "Tên sơ đồ" override field.    |
| `childInfo`                  | **A**    | Compute `items` by counting children in `viewTree` or `taxonomy`.               | Safety check for delete confirmation.                 |
| `physSection`                | **A**    | Restore `PhysSection` component from `editable-columns.ts`.                     | Restores editing for serial, position, dates, etc.    |
| `renamingGroupCode`          | **A**    | Connect to `mutations.ts` state for group ID updates.                           | Spinner for Group Code rename.                        |
| `onRenameGroupCode`          | **A**    | Call `renameEntity` with `kind: 'nh'` and `draft: false`.                       | Fixes non-responsive "Đổi mã" button.                 |
| `groupCode` / `setGroupCode` | **A**    | Lift state to `_app.he-thong.cay.tsx` or `CayContext`.                          | Syncs Group Code input field.                         |
| `onSave`                     | **B**    | **Remove**. Sheet now uses `useCayMutations` directly.                          | Simpler API, no redundant callbacks.                  |
| `submit`                     | **B**    | **Remove**. Redundant with `onSave` logic.                                      | Cleanup.                                              |
| `slugMa`                     | **B**    | **Remove**. Use `physKeyValue` from `editable-columns.ts` inside Sheet.         | Cleanup.                                              |

### 2. Implementation Strategy

#### Technical Details

- **NodeEditorSheet API Refactoring**:
  - Replace 13 loose props with a typed `NodeTarget` object and shared context.
  - Move stateful logic (group code, temp values) into a local `useNodeEditorState` hook inside the sheet or shared context.
- **Write Pipeline Integration**:
  - Use `useCellEditor` inside `NodeEditorSheet` to resolve edit intents.
  - Route all field updates (physSection) through `saveCell` or `updateEntityField`.
- **Cleanup**:
  - Delete `_app.he-thong.cay.refactor-backup.tsx` once parity is verified.
  - Move common node-type detection (`isReal`, `isCustom`, `getMa`) to `CayContext`.

### 3. File Update Plan

- `src/components/mirats/he-thong-cay/NodeEditorSheet.tsx`: API simplification + reconnection.
- `src/routes/_app.he-thong.cay.tsx`: Lift state and pass real data.
- `src/components/mirats/he-thong-cay/CayContext.tsx`: Add node metadata helpers (`unitCodeOf`, `isReal`).
- `src/components/mirats/he-thong-cay/mutations.ts`: Add `renameGroupCode` mutation.

## Verification Plan

### Automated Tests

- `NodeEditorSheet` render test: verify `physSection` appears for real devices.
- `deleteNode` safety test: verify button is disabled or warns when `childInfo.items.length > 0`.
- Rename collision test: verify `onRenameGroupCode` shows toast error if ID exists.

### Manual Verification

1. Open /he-thong/cay -> Edit Mode -> Select Device. Verify "Số serial" and "Hạn bảo hành" fields appear and save correctly.
2. Select a Group node. Change the group code (e.g., HT_1 -> HT_X). Verify DB updates and UI refreshes.
3. Select a Custom Node (MindMap only). Verify "Tên hiển thị trên sơ đồ" appears.
