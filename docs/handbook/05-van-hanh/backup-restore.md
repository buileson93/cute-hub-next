# 05 — Backup & Restore

Tài liệu chi tiết: `docs/ops/backup-restore.md`, `docs/HUONG_DAN_BACKUP_VA_GITHUB.md`.

## Backup UI

`/admin/backup` (route `admin.backup.tsx`):

- Export JSON toàn bộ bảng public → download file.
- Xem lịch sử ở `backup_lich_su`.

RPC: `backup_schema_json()`.

## Backup file

```bash
bash scripts/export-full-backup.sh
```

Sinh archive gồm: schema JSON + storage bucket.

## Storage

Script tải xuống: `scripts/download-storage.mjs`.

## Restore

1. UI: `admin_restore_database(payload jsonb)`.
2. CLI: apply lại migrations + `INSERT` từ JSON.

Luôn test restore trên môi trường staging trước.

## Retention

- `admin_get_audit_retention()` / `admin_set_audit_retention(days)` — cấu hình xoá audit_log cũ.
- Backup file: giữ ≥ 30 ngày ngoài Lovable Cloud.
