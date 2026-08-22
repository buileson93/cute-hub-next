# Plan: Fix RPC Schema Cache Regression

The error `Could not find the table 'public.rpc_thanh_phan_toan_cuc' in the schema cache` is caused by calling a database function as if it were a table using `supabase.from()`. This likely happened during the migration to `fetchKeyset` for performance.

## User Request Visual Edits
Update `src/routes/__root.tsx` to display the specific error message requested for debugging purposes.

## Technical Fix
Convert the RPC functions to Views to support the standard `supabase.from()` syntax used by the pagination utility.

### 1. Database Migration
- Create a new migration file: `supabase/migrations/20260822110000_convert_rpc_to_views.sql`.
- Drop functions: `rpc_thanh_phan_toan_cuc` and `rpc_tai_san_toan_cuc`.
- Create views: `v_thanh_phan_toan_cuc` and `v_tai_san_toan_cuc` using the existing logic (returning columns instead of `jsonb_build_object`).
- Grant `SELECT` to `authenticated` and `service_role`.

### 2. Frontend Update
- Update `src/components/mirats/ThanhPhanTable.tsx` to point to the new view names.
- Update `src/routes/__root.tsx` with the debug text.

### 3. Verification
- Run `npm run build:dev` to ensure no regressions.
- Check preview to confirm data loads correctly.

## Impact
- **An toàn dữ liệu**: Việc chuyển đổi RPC thành View chỉ thay đổi cách truy xuất dữ liệu (presentation layer), không xóa hay thay đổi dữ liệu gốc trong các bảng `thiet_bi`, `he_thong_thanh_phan`.
- **Không mất dữ liệu**: Hoàn toàn không ảnh hưởng đến tính toàn vẹn của dữ liệu hiện có.
- **Improved Tooling**: Views are better supported by Supabase generated types and filtering.
- **Improved Tooling**: Views are better supported by Supabase generated types and filtering.
