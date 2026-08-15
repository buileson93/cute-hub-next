# Kế hoạch: Hợp nhất nút chức năng và tối ưu hóa thanh công cụ

Người dùng muốn gộp các nút chức năng (có thể là cụm nút "Khai thêm") vào một menu duy nhất và đưa chúng vào thanh công cụ của bảng để làm gọn giao diện, giảm diện tích trống phía trên.

## Các thay đổi chính

### 1. Thành phần `KhaiThemCumButtons` (src/components/mirats/KhaiThemDialogs.tsx)
- Hợp nhất hai nút "Khai thêm hệ thống" và "Khai thêm thành phần" thành một nút duy nhất sử dụng `DropdownMenu`.
- Nút chính sẽ dùng icon `Plus` (Thêm mới).
- Menu thả xuống sẽ có hai lựa chọn: "Hệ thống mới" và "Thành phần mới".

### 2. Thành phần `ThanhPhanTable` (src/components/mirats/ThanhPhanTable.tsx)
- Di chuyển cụm nút "Khai thêm" (sau khi đã gộp) và nút "Chỉnh sửa nhanh" vào trong `toolbarLeft` hoặc `toolbarRight` của `StandardTable`.
- Loại bỏ hoàn toàn khối `div` phía trên bảng (nơi chứa các nút này trước đó) để bảng nằm sát lên trên hơn.
- Đảm bảo các nút trong toolbar đều đồng bộ kích thước `h-7` và chỉ hiển thị icon (kèm tooltip).

### 3. Thành phần `TreeView` (src/components/mirats/he-thong-cay/TreeView.tsx)
- Rà soát các nút "Sổ lý lịch" và hành động dòng. Nếu cần, gộp chúng vào một menu "Hành động" (icon `MoreVertical` hoặc tương tự) để tránh làm hàng cây quá dài.

## Chi tiết kỹ thuật
- Sử dụng `@/components/ui/dropdown-menu` cho menu gộp.
- Giữ nguyên logic `allowEdit` và `editMode`.
- Tinh chỉnh CSS để các nút trong toolbar không bị chồng lấn khi màn hình nhỏ.

## Kiểm tra
- Đảm bảo các hộp thoại (Dialog) vẫn mở đúng khi chọn từ menu.
- Kiểm tra mật độ hiển thị trên trang `/he-thong/thanh-phan` và `/he-thong/cay`.
