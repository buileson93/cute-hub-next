# 03 — Database: Chi tiết bảng

Tài liệu **auto-generate được** — script `scripts/docs-audit.mjs` (chưa viết) sẽ query `information_schema` để làm mới.

Trước khi có script, dùng snippet SQL sau để lấy chi tiết 1 bảng:

```sql
-- Cột
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name = '<bang>'
ORDER BY ordinal_position;

-- Khoá ngoại
SELECT kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu USING (constraint_name, table_schema)
JOIN information_schema.constraint_column_usage ccu USING (constraint_name, table_schema)
WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public' AND tc.table_name='<bang>';

-- Policy
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies WHERE schemaname='public' AND tablename='<bang>';

-- Grants
SELECT grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='<bang>' ORDER BY grantee, privilege_type;
```

## Bảng có cột nhiều nhất — cần đọc kỹ

| Bảng | Cột | Ghi chú |
|---|---|---|
| `thiet_bi` | 69 | Bảng core — nhiều cột kỹ thuật + kế thừa `don_vi_id`, `vi_tri_id` |
| `su_co` | 44 | FSM N6 (`trang_thai`), timeline start/end, downtime, nguyên nhân, biện pháp |
| `hong_hoc` | 40 | Trạng thái, phương án khắc phục, thiết bị thay thế |
| `dm_he_thong` | 35 | **Nguồn đơn vị** (`don_vi_id` bắt buộc) |
| `cong_viec_bao_tri` | 28 | Công việc PM (idempotent theo `pm_cong_viec` + kỳ) |
| `ban_giao` | 27 | Bàn giao ca — 27 cột metadata |
| `bao_tri` | 27 | Lịch sử bảo dưỡng |
| `form_submission` | 27 | Instance form đã nộp |
| `form_field` | 26 | Định nghĩa field trong template |
| `giay_phep_khai_thac` | 26 | Giấy phép khai thác |
| `bao_tri_chinh_sach` | 23 | PM policy — cron + template |
| `he_thong_thanh_phan` | 21 | Node cây; parent-child; kế thừa đơn vị |
| `lien_ket_he_thong` | 19 | Liên kết giữa hệ thống |

## Bảng bảo mật đặc biệt

| Bảng | Ghi chú |
|---|---|
| `system_signing_key` | Chỉ service_role đọc; RSA private key ký form |
| `webauthn_credentials` | Không expose ra client trừ user chủ |
| `auth_event_log` | Audit login/logout |
| `access_request` | Yêu cầu tạo tài khoản chờ admin duyệt |
| `user_roles` | Bảng vai trò tách rời (chống privilege escalation) |
| `user_scope` | Giới hạn scope theo tổ chức/đơn vị |

## Bảng có nhiều policy nhất

- `profiles`: 5 policy — self read/update + admin quản lý
- `form_submission`: 5 policy — theo trạng thái + người tạo + admin
- `app_cai_dat`, `cay_node_edit`, `conversation_participant`, `du_an`, `du_an_cong_viec`, `du_an_moc`, `backup_lich_su`, `bao_cao_annotation`, `import_alias`, `import_batch`, `node_note`, `telegram_subscriber`, `user_layout_prefs`, `user_pinned`, `user_recent`: 4 policy

## Bảng KHÔNG có policy hoặc RLS off

- `_dbg_tmp` — bảng debug tạm, không nên chứa dữ liệu thật.

## Cập nhật tài liệu này

Khi migration thêm/sửa bảng, cập nhật section tương ứng ở đây + `schema.md`. Nếu số cột / policy tăng đáng kể → chạy lại snippet SQL và ghi đè bảng.
