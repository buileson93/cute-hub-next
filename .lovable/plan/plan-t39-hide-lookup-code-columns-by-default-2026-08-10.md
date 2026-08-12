# Plan - T39: Hide lookup code columns by default

To optimize the display area for meaningful information, lookup code columns (like component codes, asset codes, etc.) will be hidden by default. These columns will still be available for users to enable via the "Column Display" button (T38) and will remain included in file exports and search indexing.

## User Review Required

> [!IMPORTANT]
> Based on the survey (Giai đoạn 1), here are the proposed changes for Phase 2.

### Survey Results & Proposal

| Column | File & Line | Status | Detail Entrance? | Proposal |
| :--- | :--- | :--- | :--- | :--- |
| **Mã thành phần** | `ThanhPhanTable.tsx:540` | Already hidden | No | Keep as is. |
| **Mã tài sản** | `ThanhPhanTable.tsx:837` | **Visible** | No (link is on Name) | **Set `defaultHidden: true`**. |
| **Mã** (General Catalog) | `CatalogTable.tsx:508` | **Visible** | No | **Set `defaultHidden: true`**. |
| **Hệ thống** (Code/Name) | `_app.danh-muc.thiet-bi.tsx:649` | **Visible** | No | **Keep visible** (Critical info). |
| **Serial Number** | `_app.danh-muc.thiet-bi.tsx:566` | **Visible** | No | **Keep visible** (Primary identifier). |

### Verification of Prerequisites & Doubts
1. **T38 (Column Display Button)**: Verified present and functional. Users can easily toggle these columns back on if needed.
2. **Detail Entrance**: In `ThanhPhanTable.tsx`, the asset link is in the "Tên tài sản" column (line 855), making it safe to hide the "Mã tài sản" column.
3. **Searchability**: Verified that global search filters include these code fields, so users can still search by code even when the column is hidden.
4. **Exports**: `StandardTable.tsx` includes all defined columns in exports regardless of visibility.
5. **Existing Users**: `defaultHidden` only affects the initial state for new users or when "Reset to default" is clicked.

## Proposed Changes

### Component: `ThanhPhanTable.tsx`
- Set `defaultHidden: true` for the "Mã tài sản" column (`key: "ma"`) at line 837.

### Component: `CatalogTable.tsx`
- Set `defaultHidden: true` for the "Mã" column (`key: "ma"`) at line 508.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` to ensure no type regressions.
- Run `npm run test` to verify table logic remains sound.

### Manual Verification
- Open the Asset list in the preview.
- Verify "Mã tài sản" is hidden by default.
- Click "Cột hiển thị" and toggle "Mã tài sản" on/off.
- Click "Đặt lại mặc định" and verify it hides again.
- Repeat for the Catalog table.
- Perform a search using a known code and verify the correct row appears.
