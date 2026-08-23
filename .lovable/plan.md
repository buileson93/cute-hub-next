# Kế hoạch khắc phục lỗi cuộn trang Tổng quan (Overview)

Phân tích hiện tại cho thấy trang `/tong-quan` (Overview) đang sử dụng `PageBody` với thuộc tính `overflow-hidden` (mặc định của `PageBody`), điều này ngăn cản việc cuộn nội dung khi Dashboard Grid có nhiều widget vượt quá chiều cao màn hình. Hơn nữa, kiến trúc `AppShell` đã có cơ chế `overflow-hidden` ở cấp độ main container để phục vụ layout "Một Scroll Owner".

## Các thay đổi chính

### 1. Cập nhật Roadmap UI (Visual Edits)
- Thay đổi văn bản Roadmap trong Tooltip của `TopBar.tsx` và `aria-label` của `TzClock.tsx` sang nội dung yêu cầu mới: "trang oview không thể cuộn xuống dc , tôi chỉ muốn cuộn phần có nội dung không phải cuộn cả trang web...".

### 2. Sửa lỗi cuộn tại trang Tổng quan (`src/routes/_app.tong-quan.tsx`)
- Cấu trúc lại trang để `PageBody` có thể cuộn nội dung bên trong (`overflow-y-auto`).
- Đảm bảo các thành phần Header và HeartBeatStrip vẫn cố định hoặc cuộn hợp lý tùy theo thiết kế "Một Scroll Owner".
- Áp dụng `noPadding` cho `PageBody` nếu cần và quản lý padding thủ công để tránh double scrollbar hoặc mất nội dung do `overflow-hidden` từ các lớp cha.

### 3. Tối ưu hóa layout Dashboard
- Đảm bảo `DashboardGrid` bên trong không bị giới hạn chiều cao bởi container cha `flex-1 overflow-hidden` của `PageBody`.
- Kiểm tra lại `PageFrame` và `AppShell` để xác nhận vùng `main` (`flex-1 overflow-hidden`) là đúng tiêu chuẩn, và chỉ cần bật cuộn ở cấp độ con trực tiếp (`PageBody` hoặc một wrapper cụ thể bên trong).

## Chi tiết thực hiện

### Tệp tin thay đổi
- `src/components/mirats/app-shell/TopBar.tsx`: Cập nhật roadmap text.
- `src/components/mirats/TzClock.tsx`: Cập nhật roadmap text.
- `src/routes/_app.tong-quan.tsx`: Thay đổi cấu trúc wrapper để bật cuộn dọc.
- `src/components/mirats/PageBody.tsx`: Kiểm tra và có thể thêm option `allowScroll` hoặc điều chỉnh CSS class.

### Các bước thực hiện
1. Cập nhật văn bản Roadmap hiển thị trên giao diện.
2. Kiểm tra `PageBody.tsx` xem có đang cứng mã `overflow-hidden` hay không.
3. Chỉnh sửa `OverviewReport` trong `tong-quan.tsx` để thêm class `overflow-y-auto` vào `PageBody` hoặc wrapper bao quanh `DashboardGrid`.
4. Xác minh trên preview để đảm bảo chỉ phần nội dung cuộn, sidebar và topbar vẫn cố định.
