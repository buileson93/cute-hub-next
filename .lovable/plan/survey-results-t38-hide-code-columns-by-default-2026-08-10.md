# Survey Results - T38 (Hide Code Columns by Default)

Verified "Column Display" (Cột hiển thị) button is working correctly. It is safe to proceed with setting `defaultHidden: true` for code columns.

## Phase 1 Survey: Code Columns Identification

| Column | File / Line | State | Entry Point? | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Mã thành phần** | `ThanhPhanTable.tsx:540` | `defaultHidden: true` | No | Keep hidden. Already correctly implemented. |
| **Mã tài sản** | `ThanhPhanTable.tsx:837` | **Visible** | No | **Set defaultHidden: true**. Link is already on "Tên tài sản" (Line 855). |
| **Mã** | `CatalogTable.tsx:508` | **Visible** | No | **Set defaultHidden: true**. Used in generic catalogs (NSX, NCC, etc.). |
| **P/N** | `ThietBiAllFields.tsx:...` (via `_app.danh-muc.thiet-bi.tsx`) | `defaultHidden: true` | No | Keep hidden. |
| **Mã Bravo** | `_app.danh-muc.thiet-bi.tsx:932` (export) | `defaultHidden: true` | No | Keep hidden. |
| **Mã vai trò (ht)** | `_app.danh-muc.thiet-bi.tsx:649` | **Visible** | No | **Keep Visible**. It shows "Hệ thống" name/code, which is high-level info. |

### Verification of Specific Requests

- **ThanhPhanTable.tsx (Asset Code)**: Confirmed `ma` (Mã tài sản) at line 837 is visible. "Tên tài sản" (line 855) has the link to details (`/thiet-bi/$maThietBi`), so hiding `ma` is safe.
- **Searchability**: Confirmed `ThanhPhanTable.tsx` uses a `normalize` function (line 234) on a joined string of all fields including `ma`, `thietBiMa`, `pN`, etc. Searching will still work even when columns are hidden.
- **Export Integrity**: `StandardTable.tsx` (line 153) uses `exportCols` which explicitly bypasses `defaultHidden` and `hideBelow` filters, ensuring all columns are exported to CSV/XLSX.
- **User Preference Sync**: `use-column-prefs.ts` (line 66) confirms that `defaultHidden` is only applied during the initial state calculation. Users who have already customized their view will not see this change automatically, unless they click "Đặt lại mặc định".

## Proposed Phase 2 Action

1.  **`src/components/mirats/ThanhPhanTable.tsx`**: Add `defaultHidden: true` to "Mã tài sản" column in the "Asset" view mode (around line 842).
2.  **`src/components/mirats/CatalogTable.tsx`**: Add `defaultHidden: true` to the "Mã" column (around line 508).
3.  **`src/routes/_app.danh-muc.thiet-bi.tsx`**: I will double check if "Mã tài sản" there also needs `defaultHidden` (it seems it already has `tb` as primary, but `ma` might be separate).

**Wait for approval from Project Owner before applying.**
