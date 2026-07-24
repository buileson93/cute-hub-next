# Dump snapshot

Tạo bằng `scripts/export-schema.sh` + `scripts/export-data.sh`.

- `schema.sql` — schema-only, chỉ schema `public` (auth/storage/realtime/... bị exclude vì role hiện tại không có quyền LOCK trên `auth`; các schema đó do Supabase tự sinh ở project mới).
- `data/*.csv` — 113 bảng public, CSV có header, xuất bằng `\copy` từng bảng.

## User test

Vì không dump được `auth.users`, tài khoản test `buileson93@gmail.com / 12345` cần export riêng qua **Lovable Cloud → Advanced settings → Export data** (`auth_users.csv`) rồi `\copy auth.users FROM ...` khi khôi phục.

## Khôi phục

Theo `docs/superpowers/specs/backend-migration-checklist.md` mục C.
