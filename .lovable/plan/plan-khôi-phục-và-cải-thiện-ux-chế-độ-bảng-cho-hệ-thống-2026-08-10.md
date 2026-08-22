# Plan: Khôi phục và Cải thiện UX Chế độ Bảng cho Hệ thống

Người dùng báo cáo rằng sau khi nâng cấp, "dạng bảng của hệ thống" không còn nữa (hoặc không thấy). Qua điều tra, hệ thống hiện có 3 giao diện chính liên quan đến Hệ thống:

1.  **Cây Hệ Thống (`/he-thong/cay`)**: Giao diện cây/mindmap (Mặc định khi nhấn vào menu "Hệ thống").
2.  **Bảng thành phần & tài sản (`/he-thong/thanh-phan`)**: Bảng chi tiết từng vị trí chức năng và tài sản đang lắp.
3.  **Danh mục hệ thống (`/danh-muc/he-thong`)**: Danh sách phẳng các Hệ thống (dành cho quản trị).

**Nguyên nhân nghi ngờ:**

- Khi tách `cay.tsx` thành `TreeView.tsx` và `CayMindMap.tsx` ở GĐ 13, Tab "Bảng" (trước đây có thể là một phần của route `/he-thong/cay`) đã được chuyển sang route riêng `/he-thong/thanh-phan` nhưng chưa được nối lại vào thanh Tabs ở giao diện Cây.
- Menu "Hệ thống" trên Sidebar trỏ trực tiếp vào `/he-thong/cay` khiến người dùng không thấy tùy chọn xem bảng.

## Các bước triển khai

### 1. Tích hợp Tab "Bảng" vào Cây Hệ Thống

Thêm tab "Bảng" vào `src/routes/_app.he-thong.cay.tsx`. Khi nhấn vào tab này, sẽ chuyển hướng (navigate) sang `/he-thong/thanh-phan` hoặc nhúng trực tiếp `ThanhPhanTable`. Tuy nhiên, vì `/he-thong/thanh-phan` đã là một route riêng với header riêng, cách tốt nhất là cập nhật thanh Tabs để người dùng thấy sự liên kết.

### 2. Cập nhật thanh Tabs tại `/he-thong/cay`

- Thêm `TabsTrigger` cho "Bảng".
- Khi chọn "Bảng", chuyển sang `/he-thong/thanh-phan`.

### 3. Cập nhật thanh Tabs tại `/he-thong/thanh-phan`

- Thêm thanh Tabs tương tự như bên trang Cây để người dùng có thể quay lại giao diện Cây/Mindmap một cách mượt mà.

### 4. Đồng nhất Menu Sidebar

- Đảm bảo menu "Hệ thống" trong `nav-contract.ts` đại diện cho cả phân hệ này.

## Chi tiết thay đổi

### `src/routes/_app.he-thong.cay.tsx`

- Thêm tab "Bảng" (icon `List`) vào `TabsList`.
- Xử lý sự kiện chuyển tab: nếu chọn `table`, `nav({ to: "/he-thong/thanh-phan" })`.

### `src/routes/_app.he-thong.thanh-phan.tsx`

- Thêm thanh `Tabs` vào `PageHeader` (hoặc ngay dưới) để chuyển đổi giữa: Bảng (Active), Cây, Sơ đồ.

### `src/components/mirats/ThanhPhanTable.tsx`

- Kiểm tra dữ liệu: Tại sao bảng hiện tại đang báo "Đang tải dữ liệu..." mãi (skeleton). Có thể do RPC `rpc_thanh_phan_toan_cuc` hoặc `rpc_tai_san_toan_cuc` gặp vấn đề sau khi đổi tên bảng `he_thong` thành `dm_he_thong` trong database.
- Rà soát các RPC trong `supabase/dump/schema.sql` để đảm bảo chúng trỏ đúng bảng mới.

## Kiểm tra (Verification)

- Truy cập `/he-thong/cay`, thấy tab "Bảng", bấm vào chuyển sang bảng thành công.
- Kiểm tra dữ liệu trong bảng hiện lên đầy đủ (không bị kẹt skeleton).
