#!/usr/bin/env bash
# Phần A — chuẩn bị source code sau khi clone repo về project Lovable mới.
set -euo pipefail
cd "$(dirname "$0")/../.."

step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

step "A2: Cài dependency (bun)"
command -v bun >/dev/null || { echo "Không tìm thấy bun"; exit 1; }
bun install

step "A3: Kiểm tra biến môi trường Supabase"
if [ -f .env ]; then
  for v in VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY VITE_SUPABASE_PROJECT_ID; do
    if grep -q "^$v=" .env; then echo "  ✓ $v"; else echo "  ✗ THIẾU $v — bật lại Lovable Cloud"; fi
  done
  echo "  Lưu ý: không dùng .env của repo gốc, giá trị phải là của project hiện tại."
else
  echo "  ✗ Không có .env — bật Lovable Cloud trước khi chạy app."
fi

step "A4: Xoá route index placeholder trùng path /"
if [ -f src/routes/index.tsx ] && [ -f src/routes/_app.index.tsx ]; then
  rm -f src/routes/index.tsx
  echo "  Đã xoá src/routes/index.tsx"
else
  echo "  Không có xung đột"
fi

step "A5: Kiểm tra asset (logo, ảnh trang login)"
node scripts/restore/check-assets.mjs || true

step "A6: Typecheck"
bunx tsgo --noEmit || echo "  (còn lỗi type — chạy tiếp Phần B: bash scripts/restore/restore-all.sh)"

cat <<'EOS'

Tiếp theo:
  bash scripts/restore/restore-all.sh    # khôi phục database
EOS
