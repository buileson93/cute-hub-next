# Checklist Di Trú Backend (Lovable Cloud → Supabase Tự Chủ)

> Nguồn tham chiếu chính. Cập nhật trạng thái khi hoàn thành từng bước.
> Mục tiêu: chấm dứt lỗi timeout DDL, mở khoá quyền tự chủ chạy migration/index/DDL nặng.

---

## A. Chuẩn bị backend mới

- [ ] Tạo Supabase project mới (region **Singapore ap-southeast-1**).
- [ ] Ghi lại vào password manager:
  - `PROJECT_REF`, `PROJECT_URL` (`https://<ref>.supabase.co`)
  - `PUBLISHABLE_KEY` (`sb_publishable_...`)
  - `SERVICE_ROLE_KEY` (`sb_secret_...`) — server-only
  - `DB password`, `JWT secret`
- [ ] Supabase Dashboard → Database → Settings:
  - `statement_timeout` role `postgres` = **300s** (SQL: `ALTER ROLE postgres SET statement_timeout = '300s';`)
  - `statement_timeout` role `authenticated` = **30s**
  - `statement_timeout` role `anon` = **10s**
- [ ] Bật extensions (Dashboard → Database → Extensions):
      `pg_cron`, `pg_net`, `pgcrypto`, `pg_trgm`, `unaccent`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`.
- [ ] Auth → Providers:
  - Email/password: **enabled**, confirm email: **disabled** (dev), **enabled** (prod).
  - Google OAuth: Client ID + Secret; redirect URIs `https://<ref>.supabase.co/auth/v1/callback`, `https://vatm.app/auth/callback`, `http://localhost:8080/auth/callback`.
- [ ] Auth → URL Configuration:
  - Site URL: `https://vatm.app`
  - Additional redirects: `https://www.vatm.app/**`, `http://localhost:8080/**`
- [ ] Storage → tạo 10 buckets giống backend cũ (private: `avatars`, `so-do-tep`, `thiet-bi-tep`, `form-submission-signatures`, `chung-chi-thiet-bi`, `bao-tri-tep`, `form-submission-attachments`, `vi-tri-media`, `so-do-hinh`, `import-batch-files`).
- [ ] Storage → RLS policies (xem `supabase/migrations-fresh/12_storage_policies.sql`).

---

## B. Xuất dữ liệu từ backend hiện tại

- [ ] **Schema-only dump** (chạy trên máy có `pg_dump` v15+):
  ```bash
  ./scripts/export-schema.sh > /tmp/schema.sql
  ```
- [ ] **Data-only dump** theo thứ tự FK (script tự sinh):
  ```bash
  ./scripts/export-data.sh /tmp/data/
  ```
- [ ] **Auth users**: Cloud → Advanced settings → Export data → tải `auth_users.csv` (giữ nguyên `id` + `encrypted_password`).
- [ ] **Storage objects**: `./scripts/export-storage.sh /tmp/storage/` (tải từng bucket qua Storage API).
- [ ] Snapshot `pg_policies`, `pg_indexes`, `pg_proc` để so sánh sau cutover:
  ```bash
  psql -c "\copy (SELECT * FROM pg_policies) TO '/tmp/policies_old.csv' CSV HEADER"
  psql -c "\copy (SELECT * FROM pg_indexes WHERE schemaname='public') TO '/tmp/indexes_old.csv' CSV HEADER"
  ```

---

## C. Nạp vào backend mới

Thứ tự **BẮT BUỘC** (chạy bằng psql với `PGURI` trỏ tới project mới):

1. [ ] `psql -f supabase/migrations-fresh/00_extensions.sql`
2. [ ] `psql -f /tmp/schema.sql` (dump từ backend cũ — chứa toàn bộ enum, table, function, trigger, policy hiện tại).
3. [ ] `psql -f supabase/migrations-fresh/10_indexes_btree.sql` (49 FK index còn thiếu).
4. [ ] `psql -f supabase/migrations-fresh/11_indexes_gin.sql` (trigram + unaccent cho search).
5. [ ] Nhập `auth.users`:
   ```bash
   psql -c "\copy auth.users FROM '/tmp/auth_users.csv' CSV HEADER"
   ```
6. [ ] `./scripts/import-data.sh /tmp/data/` (COPY theo topo order + `SET session_replication_role='replica'` tạm tắt trigger).
7. [ ] Reset sequences: `./scripts/reset-sequences.sh`.
8. [ ] `psql -f supabase/migrations-fresh/12_cron_jobs.sql` — thay `__PUBLIC_APP_URL__` bằng domain thật.
9. [ ] Upload storage: `./scripts/import-storage.sh /tmp/storage/`.
10. [ ] Batch update URL trong DB nếu path đổi (`update thiet_bi_tep_dinh_kem set duong_dan = replace(duong_dan, old_host, new_host);`).

---

## D. Cutover ứng dụng

- [ ] Workspace Settings → Env vars, cập nhật:
  ```
  SUPABASE_PROJECT_ID
  SUPABASE_URL
  SUPABASE_PUBLISHABLE_KEY
  SUPABASE_SERVICE_ROLE_KEY
  VITE_SUPABASE_PROJECT_ID
  VITE_SUPABASE_URL
  VITE_SUPABASE_PUBLISHABLE_KEY
  ```
- [ ] `bun run typecheck` — đảm bảo `types.ts` (auto-gen) sinh lại đúng.
- [ ] Preview deploy → smoke test:
  - Login email/password + Google.
  - Danh mục thiết bị: load, filter, edit mode, nhập/xuất XLSX.
  - Thành phần hệ thống: gắn/tháo tài sản.
  - Form submission: tạo + ký OTP.
  - Cron: chờ 1h hoặc trigger tay endpoint `/api/public/hooks/scan-canh-bao`.
- [ ] Chạy Playwright suite hiện có.
- [ ] So sánh `pg_policies` / `pg_indexes` mới với snapshot cũ (script `./scripts/diff-schema.sh`).
- [ ] Cutover production, monitor 24h qua Supabase Dashboard → Reports.
- [ ] Giữ backend cũ **30 ngày** trước khi xoá (rollback window).

---

## Rủi ro & mitigations

| Rủi ro                              | Xử lý                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Password hash không tương thích     | Bcrypt của Supabase Auth cross-project OK — chỉ cần giữ `encrypted_password` và `id`.                 |
| FK violation khi COPY               | `SET session_replication_role = 'replica';` trước, `= 'origin'` sau. Chạy `VALIDATE CONSTRAINT` cuối. |
| Cron URL sai domain                 | URL đọc từ `app_cai_dat.public_app_url`, cập nhật 1 dòng thay vì sửa `cron.job`.                      |
| RLS drift                           | Diff `pg_policies` — script `./scripts/diff-schema.sh policies`.                                      |
| Storage URL cứng trong DB           | Chỉ ảnh hưởng bảng có `duong_dan` cache; batch UPDATE sau import.                                     |
| MCP tools dùng service role hết hạn | Rebind biến, không thay đổi code.                                                                     |

---

## Post-migration (đợt tối ưu tiếp theo)

- [ ] Chạy `10_indexes_btree.sql` — vốn bị block ở backend cũ, giờ chạy được sạch.
- [ ] Tạo materialized view cho overview dashboard.
- [ ] Bật `pg_stat_statements` review query top-10 chậm nhất.
- [ ] Thiết lập PITR + daily backup (Supabase Pro).
