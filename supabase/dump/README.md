# Dump snapshot — 2026-09-01 (UTC)

Bản sao lưu logic của schema `public` + dữ liệu, lưu trực tiếp trong repo (GitHub).

## Nội dung

| File | Mô tả |
| --- | --- |
| `schema.sql` | Schema-only (`pg_dump --schema-only --schema=public --no-owner --no-privileges`), gồm bảng, enum, view, function, trigger, index, policy. |
| `data/*.csv` | 156 bảng public, CSV có header, xuất bằng `\copy`. |
| `data/_manifest.tsv` | Danh sách bảng + số dòng + dung lượng tại thời điểm dump. |
| `data/audit_log.csv.gz.asset.json` | Bảng `audit_log` (~32 MB) được nén gzip và lưu ngoài repo (asset), vì vượt giới hạn 10 MB/file của GitHub. Tải theo `url` trong file JSON rồi `gunzip`. |
| `rls-policies.tsv` | Toàn bộ RLS policy của schema `public` (bảng, tên policy, lệnh, roles, USING, WITH CHECK). |
| `grants.tsv` | Ma trận GRANT theo bảng × role. |
| `storage-buckets.csv`, `storage-objects.csv` | Danh mục bucket/đối tượng storage (không gồm file nhị phân). |
| `part1..5.sql` | Dump SQL cũ, giữ lại để tham chiếu lịch sử. |

## Giới hạn

- Không dump được `auth.users` (không đủ quyền). Tài khoản cần export riêng qua Lovable Cloud → Advanced settings → Export data (`auth_users.csv`) rồi `\copy auth.users FROM ...`.
- File nhị phân trong storage không nằm trong dump; tải bằng `node scripts/download-storage.mjs`.
- Không chứa bất kỳ secret/API key/mật khẩu nào.

## Khôi phục

```bash
psql "$DB_URL" -f supabase/dump/schema.sql
bash scripts/import-data.sh          # nạp data/*.csv theo thứ tự khoá ngoại
```

Chi tiết: `docs/backup-supabase.md` và `docs/superpowers/specs/backend-migration-checklist.md` mục C.

## Tạo lại snapshot

```bash
pg_dump --schema-only --schema=public --no-owner --no-privileges > supabase/dump/schema.sql
bash scripts/export-data.sh
```
