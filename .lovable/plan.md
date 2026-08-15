# Kế hoạch: Hợp nhất nút chức năng và tối ưu hóa diện tích hiển thị (MIRATS 2.0)

Người dùng yêu cầu gộp các nút chức năng "Khai thêm" vào một menu duy nhất, đưa toàn bộ nút lên thanh công cụ của bảng và thu hẹp tối đa khoảng trắng phía trên để giao diện cực kỳ gọn gàng.

## Các thay đổi chính

### 1. Hợp nhất cụm nút "Khai thêm" (src/components/mirats/KhaiThemDialogs.tsx)
- Gộp nút "Khai thêm hệ thống" (Network) và "Khai thêm thành phần" (Component) vào một nút duy nhất sử dụng `DropdownMenu`.
- Nút kích hoạt: Icon `Plus` kèm tooltip "Khai thêm mới".
- Menu lựa chọn:
  - "Hệ thống mới" (Icon Network)
  - "Thành phần mới" (Icon Component)

### 2. Tái cấu trúc Toolbar và Xóa khoảng trắng (src/components/mirats/ThanhPhanTable.tsx)
- Di chuyển nút gộp "Khai thêm" và nút "Chỉnh sửa nhanh" vào thuộc tính `toolbarLeft` của `StandardTable`.
- Loại bỏ hoàn toàn khối header/button bar phía trên bảng (dòng 447-489).
- Thu hẹp `space-y` và `padding` để bảng nằm sát lên trên, tận dụng tối đa không gian hiển thị.
- Đồng bộ toàn bộ nút trong toolbar về kích thước `h-7`, chỉ icon + tooltip.

### 3. Tối ưu hóa Cây Hệ thống (src/routes/_app.he-thong.cay.tsx)
- Loại bỏ `PageHeader` hoặc tích hợp các nút điều khiển vào một hàng ngang duy nhất sát cạnh các Tab.
- Đảm bảo `TabsContent` không có margin/padding dư thừa gây lãng phí diện tích.

## Chi tiết kỹ thuật
- Sử dụng `@/components/ui/dropdown-menu`.
- Sử dụng `AppTooltip` cho tất cả các nút icon trong toolbar.
- Kiểm tra tính tương thích của `StandardTable` khi `toolbarLeft` có nhiều thành phần hơn.

## Kiểm tra
- Xác nhận không còn khoảng trắng lớn giữa Navigation Tabs và nội dung Bảng/Cây.
- Các nút chức năng vẫn hoạt động đúng phân quyền `allowEdit`.

