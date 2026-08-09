# Kế hoạch: Nâng cấp Quản lý Vật tư dự phòng & Tương thích Hệ thống

Nâng cấp tính năng "Vật tư dự phòng" để xác định rõ vật tư này có thể thay thế cho những hệ thống nào. Hỗ trợ quan hệ một-nhiều (một vật tư thay cho nhiều hệ thống) và cho phép người dùng tự đánh giá, phân loại mức độ tương thích.

## 1. Cơ sở dữ liệu (Database)
Tạo bảng liên kết mới để lưu thông tin tương thích giữa tài sản (vật tư) và hệ thống kỹ thuật.

- **Bảng**: `public.thiet_bi_he_thong_tuong_thich`
- **Các cột**:
  - `id` (UUID, Khóa chính)
  - `thiet_bi_id` (UUID, Khóa ngoại tới `thiet_bi`, NOT NULL)
  - `he_thong_id` (UUID, Khóa ngoại tới `dm_he_thong`, NOT NULL)
  - `phan_loai` (TEXT) - VD: "Thay thế trực tiếp", "Dự phòng phụ", "Tương đương"
  - `danh_gia` (TEXT) - Ghi chú đánh giá của người dùng về khả năng thay thế
  - `created_at`, `updated_at` (Thời gian tạo/cập nhật)
- **Bảo mật (RLS)**:
  - Cho phép người dùng đã đăng nhập (authenticated) xem, thêm, sửa, xóa các liên kết này.
  - Cấp quyền (GRANT) đầy đủ cho các role cần thiết.

## 2. Quản lý Tài sản (Phía Vật tư)
Cải tiến form thông tin thiết bị để quản lý danh sách hệ thống tương thích.

- **`ThietBiFormDialog.tsx`**:
  - Thêm phần "Hệ thống có thể thay thế".
  - Cho phép chọn nhiều hệ thống từ danh mục `dm_he_thong`.
  - Với mỗi hệ thống được chọn, người dùng có thể nhập loại tương thích và đánh giá chi tiết.
- **`ThietBiDetailDrawer.tsx`**:
  - Thêm tab hoặc mục "Khả năng tương thích" hiển thị danh sách các hệ thống mà tài sản này có thể thay thế.

## 3. Quản lý Vận hành (Phía Hệ thống)
Hiển thị danh sách vật tư dự phòng tương thích ngay trong trang chi tiết hệ thống.

- **`src/routes/_app.he-thong.$id.tsx`**:
  - Thêm tab mới: "Vật tư dự phòng".
  - Liệt kê tất cả các tài sản (vật tư) được đánh giá là tương thích với hệ thống này.
  - Hiển thị trạng thái hiện tại của vật tư (đang ở trong kho nào, số lượng bao nhiêu, hay đã được lắp cho vị trí khác).

## 4. Tìm kiếm & Lọc dữ liệu
- Bổ sung bộ lọc trong danh sách tài sản (`src/routes/_app.danh-muc.thiet-bi.tsx`) để tìm nhanh vật tư dựa trên "Hệ thống tương thích".
- Cập nhật các thẻ thông tin (hover card) để hiển thị nhanh tóm tắt khả năng thay thế của vật tư.

## Các bước triển khai cụ thể
1. Chạy migration tạo bảng `thiet_bi_he_thong_tuong_thich`.
2. Xây dựng component `CompatibilityManager` (giao diện chọn nhiều hệ thống + nhập đánh giá).
3. Tích hợp quản lý tương thích vào form `ThietBiFormDialog`.
4. Hiển thị thông tin tương thích trong `ThietBiDetailDrawer`.
5. Bổ sung tab "Vật tư dự phòng" vào trang chi tiết hệ thống `$id`.
6. Kiểm tra lại phân quyền RLS và đảm bảo dữ liệu được cập nhật đồng bộ.
