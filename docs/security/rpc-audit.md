# RPC Audit — MIRATS 2.0 (Task 34)

Nguồn: `pg_proc` + `pg_roles` (dump ngày cập nhật task 34).

## Tổng quan

- **212** function trong schema `public` (136 `SECURITY DEFINER` + 76 `SECURITY INVOKER`).
- **136/136** SECURITY DEFINER function có `SET search_path TO 'public'` — không còn function nào để trống `search_path` (đã siết ở các task bảo mật trước).
- **0** function được `GRANT EXECUTE` cho vai trò `public` (PostgreSQL role, không phải schema).
- **13** SECURITY DEFINER RPC nghiệp-vụ-ghi trước Task 34 vẫn còn `EXECUTE` cho `anon` (kế thừa mặc định) — đã REVOKE trong migration `rpc_hardening`.

## Nguyên tắc bắt buộc cho mọi SECURITY DEFINER RPC

1. **`SET search_path TO 'public'`** — chặn trojan schema hijack (bắt buộc, xanh 136/136).
2. **Guard vai trò ở đầu hàm** — dùng `public.has_role(auth.uid(), ...)`, `public.can_manage_equipment(auth.uid())`, hoặc gate theo `auth.uid()` cho record của chính user. RPC không có guard tường minh phải là helper thuần đọc (không mutate) hoặc trigger function.
3. **GRANT tối thiểu** — chỉ `authenticated` (+ `service_role` mặc định). Không cấp cho `anon` trừ khi RPC được thiết kế cho anon flow (không có case như vậy trong dự án).
4. **`REVOKE EXECUTE ... FROM PUBLIC`** đi kèm mỗi lần tạo/thay hàm nhạy cảm để không kế thừa quyền mặc định.

## Ma trận RPC × vai trò (nhóm chính)

| Nhóm                  | RPC tiêu biểu                                                                                                                         | Guard nội bộ                                                                  | GRANT sau Task 34                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------- |
| Ghi nghiệp vụ atomic  | `ghi_su_co_atomic`, `ghi_bao_duong_atomic`, `ghi_hong_hoc_atomic`                                                                     | `has_role(admin\|phong_kt)` hoặc `auth.uid()` là kỹ thuật viên đơn vị tài sản | `authenticated`, `service_role`                       |
| Bulk UI (Task 32)     | `bulk_chuyen_trang_thai_su_co`, `bulk_chuyen_trang_thai_cong_viec`, `bulk_gan_field_thiet_bi`, `bulk_gan_field_vat_tu`                | `has_role(admin\|phong_kt)` ở đầu hàm                                         | `authenticated`, `service_role`                       |
| Inline edit (Task 31) | `cap_nhat_field_thiet_bi`, `cap_nhat_field_vat_tu`, `chuyen_trang_thai_su_co`                                                         | Whitelist field + `has_role(admin\|phong_kt)`                                 | `authenticated`, `service_role`                       |
| Vòng đời & khe        | `_dong_gan_lk`, `_dong_gan_va_vong_doi`, `_mo_gan_lk`, `_mo_gan_va_vong_doi`, `hoan_thanh_hong_hoc`                                   | `can_manage_equipment(auth.uid())`                                            | `authenticated`, `service_role`                       |
| Danh mục              | `dm_xoa_an_toan`                                                                                                                      | `has_role(admin)`                                                             | `authenticated`, `service_role`                       |
| Kho / xuất nhập       | `ghi_kho_nhap`, `ghi_kho_xuat`, `kho_xuat`, `apply_import_batch`                                                                      | `has_role(admin\|phong_kt)`                                                   | `authenticated`, `service_role`                       |
| Kiểm kê               | `agent_add_kiem_ke`, `ghi_kiem_ke`                                                                                                    | `auth.uid() IS NOT NULL` + đơn vị                                             | `authenticated`, `service_role`                       |
| Admin schema          | `admin_add_column`, `admin_drop_column`, `admin_rename_column`, `admin_restore_database`, `admin_rollback_audit`, `admin_list_schema` | `has_role(admin)` bắt buộc                                                    | `authenticated`, `service_role` (chỉ admin qua guard) |
| Helper cho RLS policy | `has_role`, `can_manage_equipment`, `get_user_don_vi_id`, `is_conv_participant`                                                       | STABLE, chỉ đọc                                                               | `authenticated`, `service_role` (dùng trong policy)   |
| Audit / snapshot      | `_bulk_audit_batch`, `audit_row_change` (trigger), `_mirats_snap_*`                                                                   | Trigger nội bộ / audit bookkeeping                                            | `authenticated`, `service_role`                       |
| AI / agent            | `agent_add_su_co`, `agent_add_hong_hoc`, `agent_add_bao_tri`, `ai_describe_schema`                                                    | `auth.uid() IS NOT NULL` + role                                               | `authenticated`, `service_role`                       |

## Danh sách 13 RPC REVOKE từ `anon` trong migration `rpc_hardening`

Đây là các RPC ghi/mutate mà quyền `anon EXECUTE` là kế thừa mặc định — không có luồng anon nào cần gọi, và tất cả đều có guard `auth.uid()`/role bên trong nhưng ta vẫn REVOKE để "defense-in-depth":

- `_bulk_audit_batch(text, text, integer, jsonb)`
- `bulk_chuyen_trang_thai_su_co(uuid[], text, text)`
- `bulk_chuyen_trang_thai_cong_viec(uuid[], text, text)`
- `bulk_gan_field_thiet_bi(uuid[], text, text, text)`
- `bulk_gan_field_vat_tu(uuid[], text, text, text)`
- `cap_nhat_field_thiet_bi(uuid, text, text)`
- `cap_nhat_field_vat_tu(uuid, text, text)`
- `chuyen_trang_thai_su_co(uuid, text)`
- `dm_xoa_an_toan(text, uuid)`
- `ghi_bao_duong_atomic(uuid, text, date, jsonb)`
- `ghi_hong_hoc_atomic(uuid, text, date, jsonb)`
- `ghi_su_co_atomic(uuid, text, date, jsonb)`
- `hoan_thanh_hong_hoc(uuid)`

## Kiểm định

`supabase/tests/rpc_hardening.sql` xác nhận:

1. Mọi SECURITY DEFINER function trong `public` có `search_path=public`.
2. Không SECURITY DEFINER function nào cho phép `anon` EXECUTE.
3. Không có RPC nào ghi bảng nhạy cảm mà thiếu `has_role(...)` / `can_manage_equipment(...)` / `auth.uid() IS NOT NULL` trong body (regex heuristic trên `pg_get_functiondef`, danh sách whitelist trigger/helper).

Chạy: `psql -f supabase/tests/rpc_hardening.sql` — script raise exception nếu bất kỳ điều kiện nào fail.
