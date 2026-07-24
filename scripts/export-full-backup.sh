#!/usr/bin/env bash
# =============================================================================
# MIRATS - Full Backup Export Script
# =============================================================================
# Xuất TOÀN BỘ dữ liệu (database + storage manifest) ra 1 file ZIP duy nhất
# để chuyển sang tài khoản Lovable / Supabase khác.
#
# YÊU CẦU:
#   - psql (đã cài sẵn trong sandbox Lovable, hoặc `brew install libpq`)
#   - zip
#   - Biến môi trường PGHOST / PGPORT / PGUSER / PGPASSWORD / PGDATABASE
#     (Lovable Cloud tự inject; nếu tự host, export từ Supabase dashboard)
#   - (Tuỳ chọn) SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY để export storage
#
# CHẠY:
#   bash scripts/export-full-backup.sh
#   -> Kết quả: /mnt/documents/mirats-backup-YYYYMMDD-HHMMSS.zip
# =============================================================================

set -euo pipefail

TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="${OUT_DIR:-/tmp/mirats-backup-$TS}"
ZIP_DIR="${ZIP_DIR:-/mnt/documents}"
ZIP_PATH="$ZIP_DIR/mirats-backup-$TS.zip"

mkdir -p "$OUT_DIR/tables" "$OUT_DIR/schema" "$OUT_DIR/storage" "$ZIP_DIR"

echo "==> MIRATS Full Backup"
echo "    Thư mục tạm : $OUT_DIR"
echo "    File ZIP    : $ZIP_PATH"
echo ""

# ---------------------------------------------------------------------------
# 1. Kiểm tra kết nối DB
# ---------------------------------------------------------------------------
if [ -z "${PGHOST:-}" ]; then
  echo "❌ Thiếu PGHOST. Không thể kết nối database." >&2
  echo "   Trên Lovable Cloud: dùng sandbox đã inject sẵn PG*." >&2
  echo "   Tự host: export PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE trước." >&2
  exit 1
fi

echo "==> [1/4] Kiểm tra kết nối database..."
psql -c "SELECT current_database(), current_user, now()" || {
  echo "❌ Không kết nối được database"; exit 1;
}

# ---------------------------------------------------------------------------
# 2. Xuất từng bảng public.* ra CSV
# ---------------------------------------------------------------------------
echo ""
echo "==> [2/4] Xuất từng bảng ra CSV..."

TABLES="$(psql -At -c "
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema='public' AND table_type='BASE TABLE'
  ORDER BY table_name
")"

COUNT=0
TOTAL=$(echo "$TABLES" | wc -l | tr -d ' ')
: > "$OUT_DIR/tables/_manifest.tsv"
echo -e "table\trows\tbytes" >> "$OUT_DIR/tables/_manifest.tsv"

for T in $TABLES; do
  COUNT=$((COUNT+1))
  CSV="$OUT_DIR/tables/$T.csv"
  # Xuất CSV với header
  psql -c "\COPY (SELECT * FROM public.\"$T\") TO STDOUT WITH CSV HEADER" > "$CSV" 2>/dev/null || {
    echo "   ⚠️  Bỏ qua $T (lỗi export)"
    continue
  }
  ROWS=$(psql -At -c "SELECT count(*) FROM public.\"$T\"" 2>/dev/null || echo 0)
  BYTES=$(wc -c < "$CSV" | tr -d ' ')
  echo -e "$T\t$ROWS\t$BYTES" >> "$OUT_DIR/tables/_manifest.tsv"
  printf "   [%3d/%3d] %-45s %8s rows  %10s B\n" "$COUNT" "$TOTAL" "$T" "$ROWS" "$BYTES"
done

# ---------------------------------------------------------------------------
# 3. Xuất schema (DDL) - view / function / trigger / policy summary
# ---------------------------------------------------------------------------
echo ""
echo "==> [3/4] Xuất schema summary..."

psql -c "
  SELECT schemaname, tablename, policyname, cmd, qual, with_check
  FROM pg_policies WHERE schemaname='public'
  ORDER BY tablename, policyname
" > "$OUT_DIR/schema/rls_policies.txt" 2>/dev/null || true

psql -c "
  SELECT routine_name, routine_type, security_type
  FROM information_schema.routines
  WHERE routine_schema='public'
  ORDER BY routine_name
" > "$OUT_DIR/schema/functions.txt" 2>/dev/null || true

psql -c "
  SELECT table_name, column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema='public'
  ORDER BY table_name, ordinal_position
" > "$OUT_DIR/schema/columns.txt" 2>/dev/null || true

# Copy migrations vào backup để restore đúng schema
if [ -d "supabase/migrations" ]; then
  cp -r supabase/migrations "$OUT_DIR/schema/migrations"
  echo "   ✓ Copy supabase/migrations ($(ls supabase/migrations | wc -l | tr -d ' ') files)"
fi

# ---------------------------------------------------------------------------
# 4. Storage manifest (danh sách file trong tất cả bucket)
# ---------------------------------------------------------------------------
echo ""
echo "==> [4/4] Xuất storage manifest..."

psql -c "\COPY (SELECT id, name, public, created_at FROM storage.buckets ORDER BY name) TO STDOUT WITH CSV HEADER" \
  > "$OUT_DIR/storage/buckets.csv" 2>/dev/null || echo "   ⚠️  Không đọc được storage.buckets"

psql -c "\COPY (
  SELECT bucket_id, name, owner, metadata->>'size' AS size, metadata->>'mimetype' AS mime, created_at
  FROM storage.objects ORDER BY bucket_id, name
) TO STDOUT WITH CSV HEADER" > "$OUT_DIR/storage/objects.csv" 2>/dev/null \
  || echo "   ⚠️  Không đọc được storage.objects"

BUCKET_COUNT=$(($(wc -l < "$OUT_DIR/storage/buckets.csv" 2>/dev/null || echo 1) - 1))
OBJECT_COUNT=$(($(wc -l < "$OUT_DIR/storage/objects.csv" 2>/dev/null || echo 1) - 1))
echo "   ✓ Buckets: $BUCKET_COUNT | Objects: $OBJECT_COUNT"

cat > "$OUT_DIR/storage/README.txt" <<EOF
STORAGE FILES - HƯỚNG DẪN TẢI VỀ
=================================
Script này chỉ export DANH SÁCH file trong storage (buckets.csv, objects.csv).
File nhị phân (ảnh, tài liệu) KHÔNG được tải xuống ở bước này vì có thể
rất lớn (GB).

Để tải toàn bộ file storage, dùng 1 trong 2 cách:

CÁCH 1 — UI Lovable Cloud:
  Cloud → Storage → chọn từng bucket → Download all

CÁCH 2 — Script Node.js (đặt SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY):
  node scripts/download-storage.mjs

Sau khi có toàn bộ file, upload lại vào project mới với cùng cấu trúc
bucket / path.
EOF

# ---------------------------------------------------------------------------
# 5. Ghi metadata
# ---------------------------------------------------------------------------
cat > "$OUT_DIR/BACKUP_INFO.txt" <<EOF
MIRATS FULL BACKUP
==================
Thời điểm     : $(date -Iseconds)
Database      : $(psql -At -c "SELECT current_database()")
Postgres      : $(psql -At -c "SHOW server_version")
Số bảng       : $TOTAL
Số bucket     : $BUCKET_COUNT
Số object     : $OBJECT_COUNT
Migrations    : $([ -d supabase/migrations ] && ls supabase/migrations | wc -l | tr -d ' ' || echo N/A)

CÁCH KHÔI PHỤC
==============
Xem docs/huong-dan/35-chuyen-tai-khoan.md
EOF

# ---------------------------------------------------------------------------
# 6. Đóng gói ZIP
# ---------------------------------------------------------------------------
echo ""
echo "==> Nén ZIP..."
( cd "$(dirname "$OUT_DIR")" && zip -qr "$ZIP_PATH" "$(basename "$OUT_DIR")" )
SIZE=$(du -h "$ZIP_PATH" | cut -f1)

echo ""
echo "✅ HOÀN TẤT"
echo "   File ZIP  : $ZIP_PATH"
echo "   Kích thước: $SIZE"
echo "   Số bảng   : $TOTAL"
echo ""
echo "Tải về hoặc di chuyển sang máy khác. Xem hướng dẫn khôi phục ở:"
echo "   docs/huong-dan/35-chuyen-tai-khoan.md"
