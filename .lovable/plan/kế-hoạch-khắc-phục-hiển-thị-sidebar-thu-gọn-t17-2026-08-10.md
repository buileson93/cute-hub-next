# Kế hoạch Khắc phục Hiển thị Sidebar Thu gọn (T17)

Người dùng phản hồi rằng họ chưa thấy sidebar thực sự thu gọn. Qua kiểm tra ảnh chụp màn hình, có vẻ như Sub-sidebar (thanh chức năng) vẫn đang hiển thị ở trạng thái mở rộng mặc dù logic code đã được thiết lập để thu gọn.

## Các bước thực hiện:

### 1. Kiểm tra logic `isCollapsed` trong `AppShell.tsx`

- Xác minh xem `localStorage.getItem("mirats-sidebar-collapsed")` có đang ghi đè trạng thái mặc định không.
- Đảm bảo `isCollapsed` được khởi tạo là `true` và không bị ảnh hưởng bởi các side effect khác khiến nó luôn là `false`.

### 2. Sửa lỗi CSS và Width

- Kiểm tra class `w-[3.25rem]` (khoảng 52px). Có khả năng nội dung bên trong (như `activeWs.label` hoặc menu item) vẫn đang chiếm diện tích, ngăn cản sidebar co lại.
- Thêm `overflow-hidden` triệt để vào các container con của `<aside>`.
- Đảm bảo `transition-[width]` không bị xung đột với các class flex khác.

### 3. Tối ưu trải nghiệm Hover

- Đảm bảo khi KHÔNG hover, sidebar phải về đúng `w-[3.25rem]`.
- Kiểm tra xem có phần tử nào đang che khuất sidebar khiến sự kiện `onMouseLeave` không được kích hoạt chính xác không.

### 4. Xác minh thực tế (Playwright)

- Chạy script kiểm tra kích thước thực tế của phần tử `aside` trên trình duyệt.
- Chụp ảnh màn hình chi tiết vùng Sidebar khi ở trạng thái "thu gọn".

## Xong khi:

- Sidebar hiển thị đúng dải icon (52px) khi không di chuột vào.
- Chỉ bung ra (256px) khi di chuột vào.
- Trạng thái được duy trì chính xác giữa các lần tải trang.
