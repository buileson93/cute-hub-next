# Plan - Update TzClock aria-label and Investigation of Excel Import Error

The user wants to update the `aria-label` of the `TzClock` component to a specific Vietnamese string and expresses concerns about the Excel "All-in-one" import functionality potentially breaking after recent database changes (specifically the CamelCase aliasing of view columns).

## User Review Required

> [!IMPORTANT]
> - The `aria-label` update is a direct visual text edit as requested.
> - The Excel import issue requires careful verification. The user suspects that the "All-in-one" template might fail in Microsoft Office or that bulk imports might be broken due to recent schema changes.

## Proposed Changes

### 1. Visual Text Edit
- Update `src/components/mirats/TzClock.tsx`:
    - Change `aria-label` to `"file excel all in one đang bị lỗi khi mở bằng microsoffice bạn kiểm tra sau khi sửa các database như hiện tại việc import hàng loạt có còn hoạt động không tôi rất nghi ngờ test ước khi kết luận , đưa ra kế hoạch phù hợp để khắc phục"`.

### 2. Investigation & Fix Strategy for Excel Import
- **Database Compatibility**: Verify if `runBulkImport` (in `src/lib/mirats/import-export.functions.ts`) uses the views `v_tai_san_toan_cuc` or `v_thanh_phan_toan_cuc` for existence checks or data fetching.
- **CamelCase Mapping**: Since I recently aliased database columns to CamelCase (e.g., `tyLeTuoiTho`), I must ensure the import engine's field mapping in `src/lib/mirats/import-config.ts` matches these names.
- **Excel Template Generation**: Check `src/lib/mirats/allinone-template.ts` to see if it generates templates that Microsoft Office might reject (e.g., specific ExcelJS features or metadata sheets).
- **Test Import Flow**: I will create a script to simulate a bulk import using the current schema to verify it still works.

## Technical Details

### Step 1: Update Label
Modify `src/components/mirats/TzClock.tsx`.

### Step 2: Verification of Import Logic
- Inspect `src/lib/mirats/import-config.ts` for field definitions.
- Inspect `src/lib/mirats/import-export.functions.ts` to see how it queries the database for existing records.
- If the import logic uses `from(ent.table)` (base tables like `thiet_bi`) instead of views, the recent view changes shouldn't break the import, as base table columns like `ty_le_tuoi_tho` remain unchanged. However, if it relies on views for pre-import validation, adjustments may be needed.
- Check `coerce` and `payload` construction logic in `runBulkImport`.

### Step 3: ExcelJS Compatibility
Review `buildAllInOneWorkbook` in `src/lib/mirats/allinone-template.ts` for any potential compatibility issues with Excel desktop versions.
