# 03 — Database: RLS matrix

Xem file gốc chi tiết ở `docs/security/rls-matrix.md`. Handbook này tóm tắt định hướng.

## Roles trong hệ thống

Enum `app_role` trong `user_roles.role`:

| Role            | Mô tả                                                                |
| --------------- | -------------------------------------------------------------------- |
| `admin`         | Toàn quyền, bypass mọi RLS bằng `has_role(uid,'admin')` trong policy |
| `phong_kt`      | Phòng Kỹ thuật — sửa danh mục, tài sản, hệ thống                     |
| `phu_trach_dv`  | Phụ trách đơn vị — xem/sửa scope đơn vị mình                         |
| `ktv`           | Kỹ thuật viên — nhập sự cố / hỏng hóc / bảo trì / công việc          |
| `to_truong`     | Tổ trưởng — duyệt công việc                                          |
| `quan_ly_du_an` | Quản lý dự án                                                        |
| `readonly`      | Chỉ đọc                                                              |

## Nguồn quyền GHI

File `src/lib/mirats/quyen.ts` là ma trận GHI ở client. **Phải khớp** với policy DB. Khi đổi ma trận: sửa cả 2 nơi + test bằng phiên user thật.

## Nguyên tắc RLS

1. **Không đọc `user_roles` trực tiếp trong policy** — dùng `has_role()` (SECURITY DEFINER) để tránh recursion.
2. Bảng scope theo đơn vị: check `dm_he_thong.don_vi_id ∈ user_scope`.
3. Bảng self-owned (profile, user_pinned, user_recent): `auth.uid() = user_id`.
4. Bảng admin-only: `has_role(auth.uid(),'admin')`.
5. Anon: chỉ SELECT trên bảng công khai thực sự (hiện tại không có).

## Bảng đặc biệt

| Bảng                 | Chú thích                                                                |
| -------------------- | ------------------------------------------------------------------------ |
| `user_roles`         | `SELECT` chỉ cho self + admin; INSERT/UPDATE chỉ admin                   |
| `system_signing_key` | Không cấp cho `authenticated`; chỉ service_role                          |
| `_dbg_tmp`           | RLS off — không dùng cho dữ liệu thật                                    |
| `form_submission`    | 5 policy: người tạo edit khi draft, người ký xem, admin toàn quyền, v.v. |

## Kiểm tra chéo đơn vị

pgTAP test: `supabase/tests/rls_cross_unit.sql`, `rls_hoan_thien.sql`. Chạy trước mỗi release.

## Xem policy chi tiết

```sql
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;
```
