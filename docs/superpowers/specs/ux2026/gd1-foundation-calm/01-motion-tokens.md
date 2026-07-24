# GĐ1-01 — Motion Tokens

## Goal
Chuẩn hoá thời lượng & easing animation thành design tokens; refactor các component đang dùng số cứng.

## Acceptance
- `src/styles.css` có 5 CSS vars: `--duration-fast|base|slow`, `--ease-standard|emphasized`.
- Ít nhất 3 nơi (PageTransition, dialog, dropdown/popover) dùng token thay số cứng.
- Không còn magic number `200ms`, `300ms` trong `src/components/` (grep sạch, trừ file test).

## Tests (viết trước)
File `src/lib/mirats/__tests__/motion-tokens.test.ts`:
1. `getComputedStyle(document.documentElement).getPropertyValue('--duration-base')` trả về không rỗng.
2. Snapshot: `PageTransition` render className chứa `duration-[var(--duration-base)]` hoặc dùng `transition-[var(--ease-standard)]`.
3. `rg -n "duration-200|duration-300|ease-in-out" src/components/ui/` → 0 hit (loại trừ shadcn origin nếu cần whitelist file cụ thể).

Chạy: `bunx vitest run src/lib/mirats/__tests__/motion-tokens.test.ts` — RED.

## Steps
1. Thêm block `:root { --duration-fast: 120ms; --duration-base: 200ms; --duration-slow: 320ms; --ease-standard: cubic-bezier(0.2,0,0,1); --ease-emphasized: cubic-bezier(0.3,0,0,1); }` vào `src/styles.css`.
2. Refactor `src/components/mirats/PageTransition.tsx` dùng token.
3. Refactor `dialog.tsx`, `popover.tsx`, `dropdown-menu.tsx` (nếu shadcn cho phép override qua className) — hoặc bọc bằng wrapper trong `src/components/mirats/*`.
4. Chạy grep loại bỏ số cứng.
5. Chạy test → GREEN.

## Definition of Done
- [ ] 5 CSS vars khai báo.
- [ ] 3 component đã refactor.
- [ ] `bunx vitest run motion-tokens` xanh.
- [ ] Manual QA: mở dialog, dropdown → cảm giác đồng nhất, không giật.

## Rollback
Xoá 5 vars khỏi `styles.css`; revert 3 file component; test đỏ trở lại — OK để rollback sạch.
