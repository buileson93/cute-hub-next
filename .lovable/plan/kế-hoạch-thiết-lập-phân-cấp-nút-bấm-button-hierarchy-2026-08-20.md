# Kế hoạch Thiết lập Phân cấp Nút bấm (Button Hierarchy)

Thiết lập chuẩn phân cấp thị giác cho các hành động trong ứng dụng, đảm bảo mỗi màn hình chỉ có duy nhất một hành động chính (`default`) để dẫn dắt người dùng.

## 1. Thành phần mới: Action Patterns

Tạo file `src/lib/mirats/ui/action-patterns.ts` để định nghĩa các mẫu hành động chuẩn và ánh xạ chúng với các biến thể Button.

- **DEFAULT**: Dành cho hành động chính duy nhất (Primary).
- **OUTLINE**: Dành cho hành động phụ (Secondary).
- **GHOST**: Dành cho công cụ, icon-only (Utility).
- **LINK**: Điều hướng trong văn bản.
- **DESTRUCTIVE**: Xóa vĩnh viễn (kèm ConfirmDialog).

## 2. Tài liệu hóa Button Component

Cập nhật `src/components/ui/button.tsx` để thêm chú thích về quy tắc "Duy nhất Nút chính" (One-Default Rule) vào JSDoc của component, giúp các lập trình viên khác tuân thủ hệ thống.

## 3. Áp dụng thực tế cho Danh mục Thiết bị

Thử nghiệm trên route `src/routes/_app.danh-muc.thiet-bi.tsx`:

- **Hành động chính**: "Thêm tài sản" (khi ở chế độ chỉnh sửa) sẽ giữ `variant="default"`.
- **Hạ cấp (Demote)**:
  - Nút "Xuất .xlsx", "Lịch sử": Chuyển sang `variant="ghost"` (vì là công cụ tiện ích).
  - Các nút trong Bulk Actions (Gán, Gỡ, Xóa): Chuyển sang `variant="outline"`.
  - Các nút hành động trên từng dòng (Chi tiết, Sửa, Gán, Gỡ, Xóa): Giữ `variant="ghost"` nhưng đảm bảo tính nhất quán.
- **Mục tiêu**: Đảm bảo trang chỉ có 1 nút `default` khi `editMode` được bật.

## Chi tiết kỹ thuật

- Không thay đổi logic của `buttonVariants` trong `button.tsx`, chỉ thêm tài liệu.
- Sử dụng `ACTION_PATTERNS` để làm nguồn sự thật (Source of Truth) cho các hành động.
- Chụp ảnh minh chứng trước và sau khi thay đổi để xác nhận phân cấp thị giác.

## Các bước thực hiện

1. Viết `src/lib/mirats/ui/action-patterns.ts` với mã TS hợp lệ.
2. Cập nhật JSDoc trong `src/components/ui/button.tsx`.
3. Chỉnh sửa `src/routes/_app.danh-muc.thiet-bi.tsx` theo kế hoạch hạ cấp.
4. Chụp ảnh màn hình kiểm chứng.
