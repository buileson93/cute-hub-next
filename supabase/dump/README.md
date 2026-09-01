# Dump snapshot — 2026-09-01 (UTC, làm mới)

Bản sao lưu logic của schema `public` + toàn bộ dữ liệu, lưu trực tiếp trong repo (GitHub).

## Nội dung

| File | Mô tả |
| --- | --- |
| `schema.sql` | Schema-only (`pg_dump --schema-only --schema=public --no-owner --no-privileges`): bảng, enum, view, function, trigger, index, policy. |
| `data/*.csv` | 156 bảng public, CSV có header, xuất bằng `\copy`. |
| `data/audit_log.csv.gz` | Bảng `audit_log` (~32 MB) nén gzip để nằm dưới giới hạn 10 MB/file của GitHub. |
| `data/_manifest.tsv` | Danh sách bảng + số dòng + dung lượng tại thời điểm dump. |
| `rls-policies.tsv` | Toàn bộ RLS policy schema `public` (bảng, policy, cmd, roles, USING, WITH CHECK). |
| `grants.tsv` | Ma trận GRANT theo bảng × role. |
| `storage-buckets.csv`, `storage-objects.csv` | Danh mục bucket/đối tượng storage (không gồm file nhị phân). |
| `part1..5.sql` | Dump SQL cũ, giữ để tham chiếu lịch sử. |

## Giới hạn (kỹ thuật, không thể vượt)

- Không đọc được schema `auth` (`permission denied for schema auth`) → `auth.users` phải export riêng qua Lovable Cloud → Advanced settings → Export data (`auth_users.csv`).
- File nhị phân storage không nằm trong dump: `node scripts/download-storage.mjs`.
- Dump **không chứa** secret/API key/mật khẩu. Service role key và mật khẩu DB không truy cập được từ môi trường build; khoá của bên thứ ba (Cloudflare R2, AI…) nằm trong kho secret của backend và phải nhập lại thủ công sau khi remix. Danh sách tên biến cần nhập lại: xem `.env.example` và `docs/security/secrets.md`.

## Khôi phục 1:1 sau khi remix

```bash
psql "$DB_URL" -f supabase/dump/schema.sql
gunzip -k supabase/dump/data/audit_log.csv.gz
bash scripts/restore/restore-all.sh        # hoặc: bash scripts/import-data.sh
node scripts/apply-grants.mjs
python3 scripts/restore/create-admin.py <email> <password>
```

Sau đó nhập lại các secret (Cloudflare R2, Telegram, AI…) trong phần Backend secrets.

## Tạo lại snapshot

```bash
pg_dump --schema-only --schema=public --no-owner --no-privileges > supabase/dump/schema.sql
bash scripts/export-data.sh supabase/dump/data
```
