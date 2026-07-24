# 03 — Database: RPC functions

Toàn bộ RPC nằm trong schema `public`. Đa số là `SECURITY DEFINER` với owner=`postgres` để có quyền nền cho FK/trigger. Client gọi qua `supabase.rpc('<name>', {...})`.

## Nguyên tắc

- **Owner=postgres** cho mọi RPC ghi dữ liệu (bắt buộc — xem `../04-quy-uoc/grant-discipline.md`).
- `SECURITY DEFINER` + `SET search_path = public` để an toàn.
- Tự kiểm quyền bên trong RPC bằng `has_role(auth.uid(), ...)` — không dựa vào RLS khi đã DEFINER.
- `GRANT EXECUTE ... TO authenticated, service_role, sandbox_exec, postgres`.

## Nhóm RPC theo miền

### Cây & thành phần hệ thống
- `khai_them_thanh_phan_he_thong(...)` — thêm thành phần vào cây; sinh mã `TPHT_*`; đồng bộ đơn vị.
- `khai_them_he_thong(...)` — thêm hệ thống mới.
- `_cay_apply(id)` — apply thay đổi cây (nội bộ).
- `cay_move_node`, `cay_delete_node` (xem code).
- `_sync_3lop(...)` — đồng bộ 3 lớp (thành phần / hệ thống / tài sản) theo ngày.
- `_validate_vi_tri_tuong_thich(vi_tri, thanh_phan)` — validate vị trí khả dụng.

### Lắp/tháo tài sản
- `_dong_gan_lk(...)`, `_dong_gan_va_vong_doi(...)` — đóng gán + ghi vòng đời.
- `_mo_gan_lk(...)`, `_mo_gan_va_vong_doi(...)` — mở gán mới.
- Xem thêm `device-movement-history.ts` phía client gọi.

### Sự cố / hỏng hóc / vấn đề
- `agent_add_su_co(...)`, `agent_add_hong_hoc(...)`, `agent_add_bao_tri(...)`, `agent_add_kiem_ke(...)` — AI agent nhập nhanh.
- `_n6_normalize(raw)` — chuẩn hoá text N6.
- `_map_trang_thai_tb(key)` — map key → trạng thái tài sản.

### RBAC / quyền
- `has_role(_user_id, _role app_role)` — kiểm role, dùng trong RLS.
- `get_my_permissions()` — trả roles + permissions + scope cho client.
- `can_access_du_an`, `can_manage_du_an`, `can_edit_cong_viec`, `can_access_so_do`, `can_access_ticket`, `can_view_thiet_bi`, `can_view_thiet_bi_ma`, `can_view_import_batch`, `can_manage_equipment` — helper cho policy.

### Change request (N2)
- `approve_change_request(id, ly_do)` — duyệt.
- `cancel_change_request(id)` — huỷ.

### Import / backup / schema admin
- `apply_import_batch(batch_id, limit)`.
- `_import_allowed_table`, `_import_has_dependents`, `_backup_allowed_table` — guard.
- `admin_add_column`, `admin_drop_column`, `admin_rename_column`, `admin_import_rows`, `admin_list_schema`, `admin_list_backup_tables`, `admin_restore_database`, `admin_rollback_audit`, `admin_reset_sequences`.
- `admin_get_audit_retention`, `admin_set_audit_retention`.
- `backup_schema_json()`.

### AI
- `ai_describe_schema()` — mô tả schema cho AI grounding.
- `ai_run_select(sql, max_rows)` — chạy SELECT có kiểm.

### Danh mục quality (N1)
- `_danh_muc_merge_ref_map()` — map ref khi merge duplicate.

### Audit
- `audit_row_change()` — trigger function ghi audit_log.

### Debug/util
- `_admin_check_ident/_table/_type`, `_debug_test_insert`, `_gen_ma_thiet_bi_random(len)`, `_search_tsv(tieu_de, noi_dung)`.

## Tra cứu đầy đủ

```sql
SELECT proname AS name,
       pg_get_function_identity_arguments(oid) AS args,
       CASE WHEN prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS sec,
       pg_get_userbyid(proowner) AS owner
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace AND prokind = 'f'
ORDER BY proname;

-- Xem body 1 function
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p WHERE p.proname = '<ten>' AND p.pronamespace='public'::regnamespace;
```

## Khi thêm RPC mới

1. `CREATE OR REPLACE FUNCTION public.<name>(...) RETURNS ... AS $$ ... $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;`
2. `ALTER FUNCTION public.<name>(...) OWNER TO postgres;`
3. `GRANT EXECUTE ON FUNCTION public.<name>(...) TO authenticated, service_role, sandbox_exec, postgres;`
4. `COMMENT ON FUNCTION public.<name>(...) IS '<mục đích + caller + side-effect>';`
5. Cập nhật file này + `bang-chi-tiet.md` nếu ảnh hưởng bảng.
