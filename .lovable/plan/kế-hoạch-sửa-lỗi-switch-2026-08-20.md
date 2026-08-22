---
name: Switch Component Fix Plan
description: Kế hoạch sửa lỗi hiển thị của thành phần Switch dựa trên hình ảnh tải lên.
type: feature
---

# Kế hoạch sửa lỗi Switch

Người dùng báo cáo có vấn đề với UI của Switch (gạt) thông qua hình ảnh đính kèm. Hình ảnh cho thấy nút gạt (thumb) bị lệch ra khỏi khung của Switch hoặc không hiển thị đúng vị trí khi ở trạng thái bật/tắt.

## 1. Phân tích nguyên nhân lỗi Switch (Dựa trên hình ảnh)

Quan sát `user-uploads://CleanShot_2026-08-20_at_18.31.53.png`:

- Nút gạt (màu trắng) đang nằm hoàn toàn bên ngoài khung màu xanh của Switch.
- Điều này xảy ra do sự không khớp giữa hệ thống định vị `absolute` của CSS Astryx và `translateX` của Tailwind/Radix, hoặc khung Switch thiếu `relative`.
- Code hiện tại trong `src/components/ui/switch.tsx` đang dùng `h-6 w-11` (Tailwind) đè lên CSS Astryx vốn nhỏ hơn.

## 2. Các bước sửa lỗi

### Giai đoạn 1: Chuẩn hóa thành phần Switch

- Cập nhật `src/components/ui/switch.tsx`:
  - Thêm `relative` vào class của `SwitchPrimitives.Root`.
  - Loại bỏ các class Tailwind về kích thước (`h-6 w-11`) và thumb (`h-5 w-5`) để CSS Astryx (`.astryx-switch`, `.astryx-switch-thumb`) quản lý hoàn toàn, tránh xung đột.
  - Sử dụng `UI_DENSITY.CONTROL_H` nếu cần thiết để đảm bảo đồng bộ với các control khác.

### Giai đoạn 2: Tinh chỉnh CSS Skins

- Kiểm tra `src/styles/astryx-component-skins.css`:
  - Đảm bảo `.astryx-switch` có `overflow: visible` (nếu muốn hiệu ứng thumb trồi ra) hoặc đảm bảo kích thước thumb và container khớp nhau để thumb nằm trong.
  - Cập nhật `left: 0.125rem` và `translateX` tương ứng với chiều rộng mới của Switch.

## 3. Chi tiết kỹ thuật

- **File chính**: `src/components/ui/switch.tsx`
- **File hỗ trợ**: `src/styles/astryx-component-skins.css`
- **Mục tiêu**: Thumb trắng phải nằm gọn hoặc được căn chỉnh chính xác so với khung màu xanh khi ở trạng thái `checked`.
