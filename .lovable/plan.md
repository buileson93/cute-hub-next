---
name: Phục hồi và Xây dựng Tìm kiếm Toàn văn Tài liệu (FTS)
description: Kế hoạch rà soát, nâng cấp RPC global_search và bổ sung giao diện tra cứu tài liệu chuyên sâu.
type: feature
---

# Bối cảnh
Hệ thống hiện đã có cơ chế Tìm kiếm Toàn cầu (Global Search) dựa trên PostgreSQL Full-Text Search (FTS), nhưng hiện tại chỉ tập trung vào 4 thực thể chính: Hệ thống, Tài sản, Giấy phép, và Biểu mẫu. Tài liệu (các tệp PDF đính kèm trong `thiet_bi_tep_dinh_kem` hoặc `model_tai_lieu`) chưa được lập chỉ mục FTS và chưa xuất hiện trong kết quả tìm kiếm tổng.

# Mục tiêu
1.  **Rà soát & Kích hoạt**: Xác nhận các bảng tài liệu đã có cột `search_tsv` chưa. Nếu chưa, bổ sung cột và trigger để lập chỉ mục tự động.
2.  **Tích hợp Global Search**: Cập nhật hàm RPC `global_search` để bao gồm kết quả từ các bảng tài liệu (`thiet_bi_tep_dinh_kem`, `model_tai_lieu`).
3.  **Trỏ tới tài liệu**: Đảm bảo khi bấm vào kết quả tài liệu, hệ thống mở đúng Dialog xem tài liệu (`DocViewerDialog`) hoặc điều hướng tới trang chi tiết tài sản và cuộn tới phần tài liệu.
4.  **Giao diện tra cứu chuyên sâu**: Xây dựng một trang `/tai-lieu` hoặc một Tab "Thư viện tài liệu" tập trung để lọc, tìm kiếm tài liệu theo loại, hệ thống, hoặc nội dung.

# Các bước thực hiện

## 1. Hạ tầng CSDL (SQL)
-   Kiểm tra bảng `thiet_bi_tep_dinh_kem` và `model_tai_lieu`.
-   Thêm cột `search_tsv` (tsvector) nếu chưa có.
-   Tạo trigger `BEFORE INSERT OR UPDATE` để cập nhật `search_tsv` từ `file_name` và `mo_ta` (dùng `f_unaccent` và `simple` config như các bảng khác).
-   Tạo chỉ mục GIN trên cột `search_tsv`.

## 2. Nâng cấp RPC `global_search`
-   Sửa hàm `public.global_search` trong CSDL.
-   Thêm `UNION ALL` cho `thiet_bi_tep_dinh_kem`.
-   Ánh xạ `entity` thành `tai_lieu`.
-   Trả về `title` (tên file), `subtitle` (mô tả hoặc mã thiết bị liên quan).

## 3. Cập nhật Frontend (`src/lib/mirats/global-search.tsx`)
-   Thêm `"tai_lieu"` vào type `SearchEntity`.
-   Cập nhật `ENTITY_META` để thêm icon `FileText` và label "Tài liệu".
-   Cập nhật hàm `hitTo` để xử lý điều hướng: `/thiet-bi/${maThietBi}?tab=phap-ly&doc=${id}`.

## 4. Xây dựng trang Thư viện tài liệu (Tùy chọn nâng cao)
-   Tạo route `src/routes/_app.tai-lieu.tsx`.
-   Sử dụng `StandardTable` để hiển thị danh sách tài liệu toàn hệ thống.
-   Cho phép lọc theo "Loại tài liệu" (Datasheet, CO/CQ, HDSD...) và "Hệ thống".

# Kiểm thử & Nghiệm thu
-   Gõ từ khóa là tên file tài liệu trong Command Palette (Cmd+K) hoặc Global Search.
-   Kết quả phải hiện ra với icon tài liệu.
-   Bấm vào kết quả phải mở được file hoặc chuyển đến đúng trang tài sản chứa file đó.
