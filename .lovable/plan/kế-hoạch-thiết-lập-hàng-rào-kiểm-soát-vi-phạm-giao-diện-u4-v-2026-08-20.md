# Kế hoạch Thiết lập Hàng rào Kiểm soát Vi phạm Giao diện (u4-Visual-Contract)

Thiết lập hệ thống kiểm soát tự động để đảm bảo các vi phạm về Typography (text-[Npx]), Màu sắc (Tailwind palette, HEX) và Accessibility (aria-label) chỉ có thể GIẢM, không thể TĂNG.

## 1. Mở rộng Máy quét UI Audit

Cập nhật `scripts/ui-audit.mjs` để tập trung vào phạm vi quan trọng:

- Phạm vi quét: `src/routes/**` và `src/components/mirats/**`.
- Cập nhật logic in kết quả để dễ dàng so sánh trong test.

## 2. Xây dựng Hàng rào Kiểm tra Tự động (Regression Guard)

Tạo `src/__tests__/u4-visual-contract.test.ts`:

- Đọc baseline từ `docs/ui/u4-baseline.json`.
- Chạy logic audit trên code hiện tại.
- So sánh các chỉ số: `textPxTotal`, `paletteColors`, `hexColors`, `iconNoLabel`.
- **Failure Condition**: Nếu bất kỳ chỉ số nào lớn hơn baseline, test sẽ fail và chỉ rõ file vi phạm mới.
- **Success Condition**: Nếu chỉ số nhỏ hơn hoặc bằng baseline.

## 3. Củng cố Hàng rào Linting (ESLint)

Cập nhật `eslint.config.js`:

- Thêm rule `no-restricted-syntax` để chặn trực tiếp các class `text-[...px]`, `bg-[color]-[level]`, và mã HEX trong `src/routes` và `src/components/mirats`.
- Thiết lập allowlist theo file cho các vi phạm hiện tại (dựa trên top 20 file vi phạm).
- Quy tắc allowlist: Chỉ được phép xoá file khỏi list khi đã sửa, cấm thêm mới.

## 4. Tài liệu hướng dẫn

Tạo mới `docs/ui-consistency-checklist.md`:

- Hướng dẫn xử lý khi test `u4-visual-contract` bị đỏ.
- Danh sách các token thay thế chuẩn (`TYPO`, màu theme).

## 5. Kiểm chứng (Verification)

1. Chạy `npm test` để lấy số lượng test fail hiện tại (baseline là 26).
2. Tự tạo vi phạm (`text-[9px]`) để xác nhận test `u4-visual-contract` hoạt động.
3. Chạy `ui:audit` để cập nhật số mốc chuẩn cuối cùng sau khi đã sạch vi phạm ở task trước.

## Chi tiết kỹ thuật

- **Test ID**: `u4-visual-contract`.
- **Phạm vi**: `src/routes`, `src/components/mirats`.
- **Ngôn ngữ**: Tiếng Việt.
