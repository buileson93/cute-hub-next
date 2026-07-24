#!/usr/bin/env bash
# Xuất data từng bảng public ra CSV theo topological order (FK-safe).
#
# Usage: ./scripts/export-data.sh /tmp/data/

set -euo pipefail

OUT_DIR="${1:-/tmp/data}"
mkdir -p "$OUT_DIR"

if [[ -z "${PGHOST:-}" ]]; then
  echo "ERROR: PGHOST chưa set." >&2
  exit 1
fi

# Lấy topo order từ pg_depend. Bảng không có FK sẽ ra trước.
TABLES=$(psql -At -c "
WITH RECURSIVE fk_deps AS (
  SELECT c.conrelid::regclass::text AS child,
         c.confrelid::regclass::text AS parent
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE c.contype='f' AND n.nspname='public'
),
topo AS (
  SELECT t.tablename AS name, 0 AS lvl
  FROM pg_tables t
  WHERE t.schemaname='public'
    AND NOT EXISTS (SELECT 1 FROM fk_deps f WHERE f.child = 'public.'||t.tablename)
  UNION ALL
  SELECT f.child, topo.lvl + 1
  FROM fk_deps f
  JOIN topo ON topo.name = replace(f.parent,'public.','')
  WHERE topo.lvl < 20
)
SELECT DISTINCT replace(name,'public.','')
FROM topo
ORDER BY 1;
")

for T in $TABLES; do
  echo "→ Export $T"
  psql -c "\copy public.$T TO '$OUT_DIR/$T.csv' CSV HEADER"
done

echo "Done. Files at: $OUT_DIR"
ls -la "$OUT_DIR" | tail -20
