# Kế hoạch Rà soát và Tối ưu hóa Hệ thống Nút bấm (Buttons)

Người dùng báo cáo tình trạng các nút bấm trên giao diện đang bị "cụt", thiếu nội dung văn bản và có kích thước quá nhỏ, gây khó khăn cho việc tương tác. Kế hoạch này tập trung vào việc chuẩn hóa lại component `Button` và các token mật độ (UI Density) để đảm bảo tính dễ đọc và khả năng truy cập (Accessibility).

## Các vấn đề cần giải quyết
- Nút bấm có kích thước desktop quá nhỏ (24px-28px) dẫn đến việc cắt văn bản (cụt).
- Mật độ `compact` đang ép font chữ xuống quá thấp (10px-11px).
- Thiếu padding ngang (horizontal padding) khiến văn bản sát vào mép nút hoặc icon.

## Chi tiết kỹ thuật

### 1. Cập nhật `src/lib/mirats/ui/ui-density.ts`
- Nâng kích thước `CONTROL_H` cho Desktop:
    - Compact: Từ `h-7` (28px) lên `h-8` (32px).
    - Comfortable: Từ `h-8` (32px) lên `h-9` (36px).
- Điều chỉnh `CONTROL_FS` (Font Size):
    - Compact: Đảm bảo tối thiểu `12px` (thay vì 11px).

### 2. Cập nhật `src/components/ui/button.tsx`
- Sửa lại `buttonVariants` trong `size`:
    - `default`: Nâng padding ngang `px-4` và font size `13px` cho desktop.
    - `sm`: Nâng `h-8` cho desktop, font size `12px`.
    - `xs`: Nâng `h-7` cho desktop, font size `11px` (giới hạn tối thiểu).
- Đảm bảo `gap-2` giữa icon và text không bị thu nhỏ quá mức ở chế độ compact.

### 3. Rà soát Typography (`src/lib/mirats/ui/typography.ts`)
- Đảm bảo các nhãn (`LABEL`) sử dụng trong nút bấm có `tracking-normal` thay vì `tracking-wider` nếu không gian hẹp.

### 4. Kiểm tra các trang chính
- Rà soát Dashboard Toolbar (Thêm Widget, Khôi phục).
- Rà soát Table Toolbar (Nút Export, Filter).
- Rà soát chi tiết thiết bị (Các tab và nút hành động).

## Kế hoạch xác minh
- **Visual Check**: Sử dụng Playwright để chụp ảnh các trạng thái nút bấm ở 3 mật độ: Compact, Comfortable, Spacious.
- **Accessibility Check**: Kiểm tra đích chạm (touch target) trên mobile đảm bảo luôn >= 44px (đã có logic trong component nhưng cần xác nhận không bị ghi đè bởi CSS local).
- **Text Wrap Check**: Kiểm tra các nút có văn bản dài (như "Cá nhân hóa bảng điều khiển") xem có bị cắt hay không.
