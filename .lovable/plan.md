# Kế hoạch sửa lỗi Sidebar không thu gọn (T17 - Cập nhật)

Người dùng phản hồi rằng sidebar (phân hệ chức năng) không thu gọn lại được trên Desktop. Sau khi kiểm tra ảnh chụp màn hình và mã nguồn, vấn đề nằm ở việc thiếu giới hạn chiều cao và cấu trúc flexbox khiến phần nội dung Sidebar chiếm hết không gian, đẩy nút toggle xuống dưới màn hình hoặc che mất vùng click.

## Các bước thực hiện:

### 1. Cố định chiều cao và tối ưu Layout Sidebar
- Sửa file `src/components/mirats/app-shell/AppShell.tsx`.
- Thêm các class `h-dvh sticky top-0` vào thẻ `<aside>` của Rail (thanh ngoài cùng) và Sub-sidebar (thanh chức năng).
- Đảm bảo Sub-sidebar có `flex flex-col h-dvh`.
- Bọc phần nội dung Sidebar vào một container có `flex-1 overflow-y-auto` để nút toggle ở đáy luôn cố định ở chân màn hình.

### 2. Sửa lỗi CSS Transition và Width
- Kiểm tra các class `w-64` và `w-[3.25rem]` đảm bảo chúng được áp dụng chính xác khi state `isCollapsed` thay đổi.
- Đảm bảo `transition-[width]` hoạt động mượt mà mà không bị nội dung bên trong (text "Tài sản & Hồ sơ") làm vỡ layout trong lúc co giãn.

### 3. Xác minh kỹ thuật
- Chụp ảnh màn hình trạng thái thu gọn.
- Kiểm tra lại localStorage để đảm bảo trạng thái được duy trì.

## Xong khi:
- Sidebar có thể thu gọn/mở rộng bình thường trên màn hình desktop.
- Nút toggle ở đáy sidebar luôn hiển thị rõ ràng.
- Bỏ qua các yêu cầu về "language selector" theo yêu cầu mới nhất của người dùng.
