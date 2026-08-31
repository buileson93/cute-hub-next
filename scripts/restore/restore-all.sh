#!/usr/bin/env bash
# Khôi phục toàn bộ dự án MIRATS từ dump + migrations của repo.
# Xem docs/RESTORE_FROM_GITHUB.md để hiểu từng bước.
set -euo pipefail
cd "$(dirname "$0")/../.."

step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

[ -n "${PGHOST:-}" ] || { echo "Thiếu PGHOST — session này không có quyền psql."; exit 1; }

cleanup() {
  step "Bước 7/8: Dọn dẹp (helper, bảng rác, BYPASSRLS)"
  psql -q -f scripts/restore/sql/07-cleanup.sql || true
}
trap cleanup EXIT

step "Bước 1/8: Tạo helper __restore_exec"
psql -v ON_ERROR_STOP=1 -q -f scripts/restore/sql/01-helper.sql

step "Bước 2/8: Extensions + text search dictionary"
psql -v ON_ERROR_STOP=1 -q -f scripts/restore/sql/02-extensions.sql

step "Bước 3/8: Áp schema dump"
python3 scripts/restore/apply-schema.py

step "Bước 4/8: Import CSV (multi-pass)"
python3 scripts/restore/import-data.py

step "Bước 5/8: Áp migration của repo (bù schema drift)"
python3 scripts/restore/apply-migrations.py

step "Bước 6/8: Đồng bộ sequence"
psql -v ON_ERROR_STOP=1 -q -f scripts/restore/sql/06-sync-sequences.sql

step "Bước 8/8: Kiểm tra"
psql -tAc "SELECT 'bảng/view public: ' || count(*) FROM information_schema.tables WHERE table_schema='public'"
[ -f src/routes/index.tsx ] && rm -f src/routes/index.tsx && echo "Đã xoá src/routes/index.tsx (trùng route với _app.index.tsx)"

cat <<'EOS'

Còn lại (chạy thủ công):
  python3 scripts/restore/create-admin.py buileson93@gmail.com 12345
  node scripts/apply-grants.mjs        # nếu app báo permission denied
  bunx tsgo --noEmit                   # phải sạch
EOS
