# Kế hoạch: Tối ưu hoá mật độ hiển thị và thu gọn thanh công cụ

Người dùng yêu cầu làm gọn giao diện bảng bằng cách thu nhỏ các điều khiển, chuyển đổi các nút chức năng vào thanh công cụ và giảm bớt các khoảng trắng dư thừa.

## Các thay đổi chính

### 1. Tối ưu hoá StandardTable.tsx

- **Nút "Cột hiển thị"**: Chuyển thành icon-only (loại bỏ chữ "Cột hiển thị").
- **Thu hẹp khoảng cách**: Giảm `space-y-1.5` ở container chính của bảng để bảng sát hơn với thanh công cụ.
- **Căn chỉnh**: Đảm bảo các nút trên toolbarRight đồng bộ về kích thước (h-7).

### 2. Tối ưu hoá ThanhPhanTable.tsx

- **Thanh công cụ (Toolbar)**:
  - Chuyển bộ chọn chế độ xem (Theo thành phần / Theo tài sản) vào thanh công cụ bên trái.
  - Thay thế ô tìm kiếm cố định (`w-[300px]`) bằng một ô tìm kiếm có thể thu gọn (chỉ hiện icon khi không dùng).
  - Loại bỏ nút "Xoá chọn" (Clear selection) và các nhãn văn bản dư thừa trong vùng `bulkActions`.
- **Dữ liệu**: Giữ nguyên logic lọc và phân trang hiện có.

### 3. Tối ưu hoá Route `_app/he-thong/thanh-phan`

- **Loại bỏ PageHeader**: Tiêu đề "Thành phần & tài sản" sẽ được loại bỏ vì đã có các tab chỉ dẫn rõ ràng, giúp tiết kiệm không gian theo chiều dọc.
- **Giảm Padding**: Thu hẹp khoảng cách giữa thanh tab và nội dung bảng.

## Chi tiết kỹ thuật

### StandardTable.tsx

- Chỉnh sửa `DropdownMenuTrigger` của phần cài đặt cột để chỉ hiển thị `Icon`.
- Giảm `space-y-1.5` xuống `space-y-1` hoặc loại bỏ nếu không cần thiết.

### ThanhPhanTable.tsx

- Tạo state `searchExpanded` để điều khiển hiển thị ô tìm kiếm.
- Di chuyển biến `ModeToggle` vào prop `toolbarLeft` của `StandardTable`.
- Cập nhật `bulkActions` để chỉ chứa các nút chức năng, bỏ các phần text mô tả hoặc nút "X".

### \_app.he-thong.thanh-phan.tsx

- Xoá thành phần `<PageHeader />`.
- Giảm `py-1.5` xuống `py-1` ở div header của Tabs.
