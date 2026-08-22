# GĐ1-05 — A11y Audit (Critical fixes)

## Goal

Chạy skill accessibility, fix hết critical: alt, aria-label icon-only button, focus-visible, form label, `h-dvh` thay `h-screen`.

## Acceptance

- 0 icon-only button thiếu `aria-label` trong `src/components/`.
- 0 `<img>` thiếu `alt`.
- 0 `<input>`/`<textarea>`/`<select>` không có label liên kết.
- 0 `h-screen` (đã đổi sang `h-dvh`).
- Focus-visible ring hiển thị trên mọi interactive.

## Tests (viết trước)

1. Script `scripts/a11y-lint.mjs`: grep `<button` không có `aria-label` và children là icon-only → assert 0.
2. Grep `h-screen` → 0.
3. Playwright: Tab qua sidebar → mỗi item có ring nhìn thấy được (screenshot check).
4. Playwright axe-core inject → 0 violation severity=critical trên 5 route chính (`/`, `/su-co`, `/he-thong/thanh-phan`, `/bao-tri/pm`, `/tuan-thu`).

## Steps

1. Cài `@axe-core/playwright`.
2. Viết script audit → lấy danh sách vi phạm.
3. Fix từng loại theo checklist (icon button → thêm aria-label; img → alt; input → wrap Label).
4. Global CSS: `*:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }`.
5. Sed `h-screen` → `h-dvh` (verify không phá layout).
6. Re-run axe → 0 critical.

## Definition of Done

- [ ] Script chạy CI-friendly (exit 1 khi có vi phạm).
- [ ] Axe report kèm file trong `/tmp/a11y/`.
- [ ] 4 assertion grep xanh.

## Rollback

Không cần rollback tính năng; nếu có regress visual → điều chỉnh CSS `focus-visible`.
