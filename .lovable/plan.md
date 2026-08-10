# Kế hoạch sửa lỗi hiển thị và thu gọn Sidebar trên Desktop (T17 - Tiếp tục)

Người dùng báo cáo không thấy chức năng thu gọn sidebar trên desktop ("tôi không thấy giao diện desktop thu gọn dc sidebar"). Qua kiểm tra, nguyên nhân là do sidebar không được giới hạn chiều cao, khiến nút thu gọn bị đẩy xuống dưới màn hình khi danh sách menu quá dài.

## Các bước thực hiện:

### 1. Cố định chiều cao và vị trí Sidebar
- Sửa file `src/components/mirats/app-shell/AppShell.tsx`.
- Thêm các class `h-dvh sticky top-0` vào cả hai thẻ `<aside>` (Thanh Rail và Thanh Sub-sidebar).
- Đảm bảo cấu trúc flexbox bên trong Sub-sidebar (`flex-col` với `flex-1 overflow-y-auto` ở giữa) hoạt động đúng để nút toggle ở `mt-auto` luôn hiển thị ở đáy màn hình.

### 2. Kiểm tra và xác minh
- Sử dụng Playwright để kiểm tra chiều rộng của sidebar sau khi click nút thu gọn trong môi trường desktop.
- Chụp ảnh màn hình để xác nhận nút "Thu gọn thanh điều hướng" đã xuất hiện và hoạt động.

### 3. Làm rõ về yêu cầu "visual text edits"
- Chuỗi "language selector" hiện không tồn tại trong mã nguồn (đã tìm kiếm toàn bộ project).
- Nếu người dùng muốn đổi nhãn của một thành phần cụ thể (ví dụ: TzClock - Chọn múi giờ), cần xác nhận lại. Tạm thời ưu tiên sửa lỗi kỹ thuật về sidebar mà người dùng đang gặp phải.

## Xong khi:
- Nút thu gọn sidebar luôn hiển thị ở góc dưới bên trái trên màn hình desktop.
- Click nút thu gọn làm sidebar co lại còn ~52px (`w-[3.25rem]`).
- Trạng thái được lưu vào localStorage và khôi phục sau khi tải lại trang.
