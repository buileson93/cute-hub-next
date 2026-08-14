# Phục hồi nút mở Sổ lý lịch hệ thống

Người dùng phản hồi rằng họ "không bấm được vào sổ lý lịch" từ giao diện cây (TreeView) trong trang `/thiet-bi`. Hiện tại, nút Sổ lý lịch (`History` icon) chỉ xuất hiện ở cấp **Tài sản** (lá cuối cùng) khi hover, nhưng thiếu ở cấp **Hệ thống** (nút trung gian).

## Mục tiêu
1. Cho phép người dùng mở Sổ lý lịch của một **Hệ thống** (`/he-thong/$id`) trực tiếp từ cây phân cấp.
2. Đảm bảo nút điều hướng hiển thị rõ ràng và nhất quán với các nút khác trong cây.

## Kế hoạch thực hiện

### 1. Cập nhật `TreeView.tsx`
- Sửa hàm `renderNode` để thêm một cột action (nút bấm) bên phải cho các node có `kind === 'ht'`.
- Nút này sẽ sử dụng icon `History` và link tới `/he-thong/$id`.
- Tương tự như tài sản, nút này sẽ hiện lên khi hover vào hàng của hệ thống.

### 2. Cập nhật `TreeView` Interface
- Đảm bảo `TreeNode` interface có đủ thông tin `sysId` để tạo link.

### 3. Kiểm tra logic điều hướng
- Xác minh link `/he-thong/$id` hoạt động đúng với `id` được truyền từ `ThietBiPage`.

## Chi tiết kỹ thuật
- File: `src/components/mirats/so-ly-lich/TreeView.tsx`
- Thêm block `Link` với icon `History` vào cuối dòng hiển thị node hệ thống (dòng 78-79).
- Sử dụng `opacity-0 group-hover:opacity-100` để giữ giao diện sạch sẽ nhưng vẫn dễ khám phá.
