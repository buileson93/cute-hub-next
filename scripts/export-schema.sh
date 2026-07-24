#!/usr/bin/env bash
# Xuất schema (không data) từ backend hiện tại.
# Yêu cầu: pg_dump v15+ và biến PG* đã set (PGHOST/PGUSER/PGPASSWORD/PGDATABASE).
#
# Usage: ./scripts/export-schema.sh > /tmp/schema.sql

set -euo pipefail

if [[ -z "${PGHOST:-}" ]]; then
  echo "ERROR: PGHOST không set. Cần biến kết nối PG* của backend cũ." >&2
  exit 1
fi

pg_dump \
  --schema-only \
  --schema=public \
  --no-owner \
  --no-privileges \
  --no-publications \
  --no-subscriptions \
  --no-tablespaces \
  --exclude-schema=cron \
  --exclude-schema=net \
  --exclude-schema=vault \
  --exclude-schema=supabase_functions \
  --exclude-schema=storage \
  --exclude-schema=auth \
  --exclude-schema=realtime \
  --exclude-schema=extensions \
  "$@"

# Chú ý:
# - Không dump auth/storage/realtime — Supabase project mới đã tự sinh.
# - Cron sẽ nạp riêng qua 12_cron_jobs.sql.
# - GRANT không dump ở đây; migrations-fresh + trigger auto-grant của project mới sẽ xử lý.
