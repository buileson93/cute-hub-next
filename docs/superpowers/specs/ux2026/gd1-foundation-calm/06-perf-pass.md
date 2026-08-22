# GĐ1-06 — Performance Pass

## Goal

Giảm bundle initial + LCP các route nặng: form designer, mindmap, xuất word/pdf.

## Acceptance

- Route `/`, `/su-co`, `/he-thong/thanh-phan` LCP < 1.5s trên preview (Playwright + performance API).
- Form designer & mindmap dùng `React.lazy` + Suspense fallback skeleton.
- `react-flow`, `docx`, `qrcode` không nằm trong initial chunk (kiểm bằng `bun run build` output).

## Tests (viết trước)

1. Script `scripts/perf-budget.mjs`: parse output `bun run build`, đảm bảo initial chunk < 400KB gzip.
2. Playwright `/tmp/browser/perf/lcp.py`: navigate 3 route, đo `PerformanceObserver('largest-contentful-paint')` → assert < 1500ms mỗi route.
3. Snapshot test: import `<FormDesigner />` từ route lazy → nếu import trực tiếp trong module top-level thì fail.

## Steps

1. Đổi các import nặng sang `const FormDesigner = React.lazy(() => import('...'))`.
2. Bọc bằng `<Suspense fallback={<Skeleton />}>`.
3. Kiểm tra `word-export`, `pdf-export`, `qrcode` — dynamic import bên trong handler.
4. Prefetch on hover cho `<Link to="/forms">` (tanstack `preload="intent"`).
5. Chạy `bun run build` → phân tích, tinh chỉnh.
6. Chạy perf script → GREEN.

## Definition of Done

- [ ] LCP < 1.5s trên 3 route.
- [ ] Initial chunk < 400KB gzip.
- [ ] `bun run build` không warning về chunk > 500KB.

## Rollback

Đổi lazy → eager import ở các route bị regression tính năng.
