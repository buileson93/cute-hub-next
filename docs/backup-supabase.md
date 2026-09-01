# Sao lưu toàn diện Database & RLS (Admin)

Tài liệu mô tả tính năng **Quản trị → Sao lưu → Sao lưu toàn diện (Database & RLS)** tại route
`/admin/backup`.

## 1. Mục tiêu

Tạo một gói `.zip` tự tải về máy, đủ dữ liệu để dựng lại dự án trên một backend Supabase khác:
cấu trúc CSDL, dữ liệu bảng, RLS/policies, grants, metadata tài khoản và Storage, kèm manifest
và hướng dẫn phục hồi.

## 2. Kiến trúc

| Lớp | Tệp | Vai trò |
| --- | --- | --- |
| CSDL | hàm `public.admin_export_ddl()` | `SECURITY DEFINER`, `search_path` cố định, kiểm tra `has_role(current_uid(),'admin')`. Chỉ đọc catalog và sinh DDL: enum, bảng, ràng buộc, index, view, function, trigger, RLS, policies, grants bảng/sequence. |
| Server | `src/lib/full-dump.functions.ts` | `fullDumpManifest`, `fullDumpTableChunk`, `fullDumpAuthUsers`, `fullDumpFileUrls`, `fullDumpDdl`. Tất cả dùng `requireSupabaseAuth` + `assertAdmin` trước khi chạm dữ liệu đặc quyền. Service role chỉ tồn tại phía server. |
| Logic thuần | `src/lib/mirats/backup/dump-artifacts.ts` | Tên thư mục, thứ tự phục hồi theo khoá ngoại, kiểu `DumpManifestFile`/`DumpArtifact`, danh sách phạm vi và giới hạn, sinh `README-RESTORE.md` + `limitations.md`. |
| UI | `src/components/mirats/backup/FullBackupPanel.tsx` | Card phạm vi (✅/⚠️/🔒), dialog xác nhận, tiến trình theo bước, kết quả từng phần, nén `.zip` bằng `fflate` (đã có sẵn trong dự án). |
| Kiểm thử | `src/lib/mirats/backup/dump-artifacts.test.ts` | Vitest: đặt tên gói, thứ tự phục hồi (kể cả chu trình), nội dung tài liệu restore. |

## 3. Cấu trúc gói xuất

```text
supbase-dump-YYYYMMDD-HHmmss/
├── manifest.json                     # formatVersion, createdAt, counts, restoreOrder, artifacts, limitations
├── schema.sql                        # enum → bảng → ràng buộc → index → view → function → trigger
├── rls-policies.sql                  # ENABLE/DISABLE RLS + CREATE POLICY (cmd, roles, USING, WITH CHECK)
├── grants.sql                        # GRANT bảng & sequence cho anon / authenticated / service_role
├── data/<table>.json                 # dữ liệu từng bảng, đọc theo lô 1000 dòng
├── auth/users-metadata.json          # id, email, phone, trạng thái xác nhận, metadata, timestamps
├── storage/metadata-and-policies.json# bucket, đường dẫn, kích thước (Storage + R2)
├── README-RESTORE.md                 # thứ tự phục hồi + script nạp dữ liệu chạy được
└── limitations.md                    # phần không thể export và cách xử lý
```

Bảng trong `data/` được liệt kê theo `manifest.restoreOrder` — sắp xếp topo theo khoá ngoại
(cha trước, con sau); chu trình được đẩy về cuối kèm khuyến nghị `SET session_replication_role = replica`.

## 4. Bảo mật

- Route `/admin/backup` chặn non-admin ở UI, nhưng **quyền thực sự nằm ở server**: mọi server
  function kiểm tra token + `has_role(..., 'admin')` trước khi đọc.
- Không có service role key nào rời khỏi máy chủ.
- Không xuất: mật khẩu băm, JWT secret, service key, OAuth client secret, API key, biến môi trường.
- Không ghi log dữ liệu cá nhân ra console; chỉ ghi tên artifact và số dòng.
- Toàn bộ thao tác là **chỉ đọc** — không có INSERT/UPDATE/DELETE nào trong luồng export.

## 5. Giới hạn (được nêu trong UI, `manifest.json` và `limitations.md`)

- Mật khẩu băm và identities secret của `auth.users` không có API để đọc → phải mời người dùng
  đặt lại mật khẩu sau khi phục hồi (giữ nguyên `id` khi tạo lại bằng Admin API).
- Cấu hình nền tảng (Auth providers, SMTP, redirect URL, cron, secrets) phải sao lưu bằng
  Dashboard hoặc `supabase db dump` / CLI chính thức.
- Nội dung tệp trong Storage/R2 không nằm trong gói này; dùng nút **Dump toàn bộ** (kèm tệp) khi cần.
- Trình duyệt không ghi được vào `supbase/dump/` của repository → gói tải về máy, muốn lưu cùng
  mã nguồn thì giải nén vào `supbase/dump/` (đã có `.gitignore`).
- Nén trong bộ nhớ trình duyệt phù hợp tới khoảng 1–2 GB; vượt ngưỡng nên dùng CLI.

## 6. Phục hồi

1. `psql "$DB_URL" -f schema.sql`
2. `psql "$DB_URL" -f rls-policies.sql`
3. `psql "$DB_URL" -f grants.sql`
4. Nạp `data/*.json` theo `manifest.restoreOrder` (script mẫu nằm trong `README-RESTORE.md`).
5. Tạo lại người dùng bằng `supabase.auth.admin.createUser()` với `id` cũ, sau đó dữ liệu
   `user_roles` / `profiles` đã nạp ở bước 4 sẽ khớp trở lại.

## 7. Kiểm thử

```bash
bunx vitest run src/lib/mirats/backup/dump-artifacts.test.ts
```
