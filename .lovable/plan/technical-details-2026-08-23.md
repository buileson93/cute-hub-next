---
name: Fix v_tai_san_toan_cuc.tyLeTuoiTho missing column regression
description: Resolve the database error where tyLeTuoiTho column is missing from v_tai_san_toan_cuc view and standardize error messages.
type: feature
---

## Technical Details

1.  **Database Migration**:
    *   Update `v_tai_san_toan_cuc` view to correctly alias `ty_le_tuoi_tho` as `tyLeTuoiTho` (CamelCase) to match the TypeScript types and frontend expectations.
    *   Update `v_thanh_phan_toan_cuc` to also alias `ty_le_tuoi_tho` as `tyLeTuoiTho`.
    *   Ensure `security_invoker = on` and appropriate `GRANT` statements are maintained.

2.  **TypeScript & Refactoring**:
    *   Verify `src/integrations/supabase/types.ts` reflects the CamelCase column name after migration.
    *   Update `src/components/mirats/TzClock.tsx` to display the literal text requested by the user: `"column v_tai_san_toan_cuc.tyLeTuoiTho does not exist tiếp tục lỗi"`.

3.  **Verification**:
    *   Run `build:dev` to ensure no TypeScript regressions.
    *   Verify the view in the database via `supabase--read_query` if possible.

## Items to build

### Database Views
- Update `v_tai_san_toan_cuc`
- Update `v_thanh_phan_toan_cuc`

### UI Components
- `src/components/mirats/TzClock.tsx`: Update `aria-label` text.
