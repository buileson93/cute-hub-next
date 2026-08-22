# Kế hoạch Phase U10: Verification & Guardrails (Xác minh & Hàng rào kỹ thuật)

Mục tiêu: Thiết lập hệ thống kiểm soát chất lượng (Guardrails) để ngăn chặn hồi quy UI và đảm bảo mọi tính năng được xác minh nghiêm ngặt trước khi hoàn tất.

## 1. Thiết lập Hàng rào kỹ thuật (Guardrails)

### ESLint / AST Rules

Bổ sung các quy tắc vào `eslint.config.js` để tự động hóa việc kiểm tra:

- **Cấm raw `<button>`**: Chặn sử dụng thẻ HTML `<button>` trực tiếp trong `src/routes` và `src/components/mirats` (trừ một số file allowlist đặc biệt). Yêu cầu dùng component `Button` chuẩn.
- **Cấm raw `<table>`**: Chặn sử dụng `<table>` HTML thuần ngoài các file primitive (`src/components/ui/table.tsx`) hoặc adapter. Yêu cầu dùng `DataTableCore`.
- **Cảnh báo class mâu thuẫn**: Phát hiện các class Tailwind mâu thuẫn như `hidden ... flex` mà không có tiền tố responsive.
- **Cấm style global cho table**: Chặn các selector `table th`, `table td` không có scope trong file CSS.

### Kiểm tra khả năng truy cập (A11y)

- Nâng cấp `scripts/ui-audit.mjs` để bắt lỗi các icon-only button thiếu `aria-label` hoặc `tooltip`.

## 2. Kiểm thử hợp đồng (Contract Tests)

Viết các bài kiểm tra tự động để đảm bảo tính đúng đắn của component:

- **Button**: Xác minh các variant, trạng thái loading, và tooltip tự động.
- **DataTableCore**: Kiểm tra cơ chế sticky header/column, border trong chế độ `border-separate`, và khả năng tính toán `fitViewport`.

## 3. Ma trận xác minh (Verification Matrix)

Tạo file `docs/verification-matrix.md` để ghi nhận kết quả kiểm tra thủ công và tự động trên:

- **Thiết bị**: Chrome Desktop (1440px), Tablet (1024px), Mobile (390px).
- **Tương tác**: Chuột, Bàn phím (Tab/Enter/Space/Escape), trạng thái focus.
- **Chủ đề/Mật độ**: Light/Dark mode, Compact/Comfortable density.
- **Dữ liệu bảng**: Trạng thái trống/đang tải/lỗi, văn bản dài, sticky, phân trang, mobile card.

## 4. Thực thi và Báo cáo

Chạy chuỗi lệnh kiểm tra toàn diện và báo cáo kết quả:

1. `npm run lint` (đã bao gồm các rule mới).
2. `npm run typecheck` (đảm bảo tính toàn vẹn Type).
3. `npm test` (chạy các test unit/contract mới).
4. `npm run build` (xác minh khả năng đóng gói cho production).
5. `npm run ui:audit` (báo cáo vi phạm UI cuối cùng).

## Chi tiết kỹ thuật

- **ESLint**: Sử dụng `no-restricted-syntax` với các selector AST chính xác.
- **CSS Audit**: Kiểm tra thủ công và dọn dẹp `src/styles.css` để loại bỏ các selector table global.
- **Testing**: Sử dụng Vitest + React Testing Library cho component tests.
