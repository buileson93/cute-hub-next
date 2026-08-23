# Kế hoạch Cập nhật Văn bản Trực quan

Người dùng yêu cầu thay đổi nội dung văn bản trong giao diện từ nhãn cũ sang nhãn mới. Theo lịch sử chỉnh sửa, vị trí cần thay đổi nằm trong `aria-label` của thành phần `TzClock`.

## Các thay đổi dự kiến

### 1. Thành phần `TzClock.tsx`
- **Vị trí**: `src/components/mirats/TzClock.tsx`
- **Thay đổi**: Cập nhật giá trị của thuộc tính `aria-label` trong thẻ `button` (bên trong `DropdownMenuTrigger`).
- **Nội dung cũ**: `bị lỗi [object Object] kiểm tra lại` (Đây là kết quả từ lần chỉnh sửa trước đó thay thế cho "language selector").
- **Nội dung mới**: `vẫn bị lỗi [object Object] rà soát querry và tìm cách khắc phục`

## Chi tiết kỹ thuật
- Chỉnh sửa trực tiếp file `src/components/mirats/TzClock.tsx` tại dòng 47.
- Đảm bảo giữ nguyên cấu trúc JSX và các thuộc tính khác.
