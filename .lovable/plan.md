---
name: Switch Component Fix Plan
description: Kế hoạch sửa lỗi hiển thị của thành phần Switch và cập nhật văn bản UI.
type: feature
---
# Kế hoạch sửa lỗi Switch và cập nhật UI

Người dùng báo cáo có vấn đề với UI của Switch (gạt) và yêu cầu thay đổi văn bản "language selector". Qua rà soát, "language selector" hiện không tồn tại trong code nhưng có trong lịch sử kế hoạch, có thể ám chỉ thành phần `TzClock` (chọn múi giờ) trên TopBar.

## 1. Phân tích nguyên nhân lỗi Switch
Dựa trên code hiện tại trong `src/components/ui/switch.tsx` và `src/styles/astryx-component-skins.css`:
- **Xung đột Class**: Thành phần đang dùng cả các class Tailwind thô (`h-6 w-11`) và class Astryx (`astryx-switch`).
- **Kích thước không khớp**: CSS Astryx định nghĩa `width: 2.25rem (36px)` và `height: 1.25rem (20px)`, trong khi Tailwind class là `h-6 (24px) w-11 (44px)`.
- **Thumb (Nút gạt)**: CSS định vị thumb bằng `position: absolute`, nhưng Tailwind class trong `SwitchPrimitives.Thumb` lại dùng `transition-transform` với `translateX`. Nếu class `astryx-switch-thumb` có `position: absolute` mà cha không được thiết lập đúng `relative` hoặc kích thước bị đè, thumb sẽ bị lệch hoặc biến mất.
- **Màu sắc**: Đang sử dụng `data-[state=checked]:bg-primary` nhưng có thể bị ghi đè bởi layer CSS Astryx.

## 2. Các bước sửa lỗi

### Giai đoạn 1: Chuẩn hóa thành phần Switch
- Cập nhật `src/components/ui/switch.tsx` để loại bỏ các class Tailwind kích thước cứng, thay bằng các token từ `UI_DENSITY` hoặc để CSS Astryx quản lý hoàn toàn nhằm đảm bảo tính nhất quán.
- Đảm bảo `SwitchPrimitives.Root` có `relative` để thumb `absolute` hoạt động chính xác.

### Giai đoạn 2: Đồng bộ CSS Skins
- Kiểm tra lại `src/styles/astryx-component-skins.css` để đảm bảo `.astryx-switch` và `.astryx-switch-thumb` có tỷ lệ khớp nhau (ví dụ: switch cao 20px thì thumb nên 16px với margin 2px).

### Giai đoạn 3: Cập nhật văn bản
- Thay đổi văn bản hoặc nhãn liên quan đến "language selector" (nếu tìm thấy trong các file cấu hình hoặc tooltip) thành nội dung mới theo yêu cầu: "UI của switch này đang có vấn đề tìm hiểu nguyên nhân lên kế hoạch bằng tiếng việt cách sửa". *Lưu ý: Nếu không tìm thấy văn bản này, tôi sẽ áp dụng nó vào phần mô tả/tooltip của thành phần Switch trong UI Kit để làm mẫu.*

## 3. Chi tiết kỹ thuật
- **File**: `src/components/ui/switch.tsx`
- **Thay đổi**: 
  - Root: Loại bỏ `h-6 w-11`, thêm `relative`.
  - Thumb: Loại bỏ `h-5 w-5` nếu CSS Astryx đã định nghĩa.
- **Kiểm tra**: Xem lại trang `/admin/ui-kit` để xác nhận Switch hiển thị đúng ở cả 2 trạng thái bật/tắt.
