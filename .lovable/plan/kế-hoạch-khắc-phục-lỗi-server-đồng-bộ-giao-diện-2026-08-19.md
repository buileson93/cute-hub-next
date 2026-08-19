# Kế hoạch khắc phục lỗi Server & Đồng bộ giao diện

Người dùng thông báo có lỗi server sau các thay đổi gần đây. Mặc dù build thành công, preview có dấu hiệu không phản hồi hoặc timeout.

## Mục tiêu
1. Xác định và sửa lỗi gây treo preview (thường do loop vô hạn hoặc render lỗi nghiêm trọng).
2. Kiểm tra lại các thay đổi về màu sắc nút "Cá nhân hóa" (Hoàn tất) trên Dashboard.
3. Kiểm tra tính ổn định của `TreeView` mới.

## Các bước thực hiện

### 1. Phân tích lỗi treo preview
- Kiểm tra lại logic `isEditing` trong `_app.index.tsx` và `_app.tong-quan.tsx` để xem có trigger render loop không.
- Kiểm tra các `useEffect` mới thêm hoặc các thay đổi trong `TreeView.tsx` có gây đệ quy vô hạn không.

### 2. Sửa lỗi màu sắc (VATM Blue)
- Đảm bảo màu `#0074e2` (MIRATS Blue) được áp dụng đúng vào `background` của nút khi `isEditing` là true.
- Sử dụng class Tailwind `!bg-[#0074e2]` và `!text-white` để cưỡng bức hiển thị.

### 3. Kiểm định `TreeView`
- Xác nhận layout Minimalist hoạt động mượt mà, không gây lỗi layout shift hoặc treo trình duyệt do quá nhiều cấp bậc.

## Chi tiết kỹ thuật
- Tệp tin ảnh hưởng: `src/routes/_app.index.tsx`, `src/routes/_app.tong-quan.tsx`, `src/components/mirats/so-ly-lich/TreeView.tsx`.
- Sử dụng `!important` trong CSS hoặc class Tailwind để giải quyết xung đột theme Astryx.
