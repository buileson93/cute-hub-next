#!/usr/bin/env bash
# Nạp CSV vào backend mới. Chạy sau khi đã nạp schema + auth.users.
#
# Usage: PGHOST=<new> PGUSER=postgres ... ./scripts/import-data.sh /tmp/data/

set -euo pipefail

IN_DIR="${1:-/tmp/data}"

if [[ -z "${PGHOST:-}" ]]; then
  echo "ERROR: PGHOST của backend MỚI chưa set." >&2
  exit 1
fi

echo "!!! Sẽ nạp data vào $PGHOST/$PGDATABASE — Enter để tiếp tục, Ctrl+C để huỷ..."
read -r

# Tắt trigger + FK check tạm thời
psql -c "SET session_replication_role = 'replica';"

# Import theo thứ tự file (file name = tên bảng, script export đã tạo topo)
for F in "$IN_DIR"/*.csv; do
  T=$(basename "$F" .csv)
  echo "→ Import $T"
  psql -c "\copy public.$T FROM '$F' CSV HEADER" || {
    echo "  FAILED — bỏ qua $T, review sau"
  }
done

# Bật lại
psql -c "SET session_replication_role = 'origin';"

# Reset sequences
psql -c "
DO \$\$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS seq, t.relname AS tbl, a.attname AS col
    FROM pg_class c
    JOIN pg_depend d ON d.objid = c.oid AND d.classid='pg_class'::regclass
    JOIN pg_class t ON t.oid = d.refobjid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.relkind='S' AND n.nspname='public'
  LOOP
    EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM public.%I), 1))',
                   'public.'||r.seq, r.col, r.tbl);
  END LOOP;
END\$\$;
"

# Validate FK
psql -c "
DO \$\$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT conname, conrelid::regclass AS tbl
           FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %s VALIDATE CONSTRAINT %I', r.tbl, r.conname);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'FK VIOLATION: %.%  → %', r.tbl, r.conname, SQLERRM;
    END;
  END LOOP;
END\$\$;
"

echo "Done."
