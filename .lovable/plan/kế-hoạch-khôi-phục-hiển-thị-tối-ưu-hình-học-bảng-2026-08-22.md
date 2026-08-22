# Kế hoạch Khôi phục Hiển thị & Tối ưu Hình học Bảng

Kế hoạch này tập trung vào việc khôi phục các tùy chọn hiển thị bị thiếu trong tab Hệ thống và đảm bảo trải nghiệm cuộn bảng (Table Geometry) ổn định, không làm trôi giao diện ứng dụng.

## Các mục tiêu chính

1.  **Khôi phục "Theo Tài sản" & "Theo Thành phần" & Nút chức năng**: Đảm bảo các lựa chọn này và các nút tính năng cột (hiển thị/ẩn cột) hiển thị rõ ràng và hoạt động chính xác.
2.  **Tối ưu ảo hóa & Infinite Scroll**: Khắc phục hiện tượng giật lag khi tải nhiều dữ liệu bằng cách tối ưu hóa `useVirtualizer` và logic `useInfiniteQuery`.
3.  **Tối ưu Hình học Bảng (Table Geometry)**: Áp dụng nguyên tắc "Một Scroll Owner" duy nhất. Bảng sẽ chiếm trọn không gian còn lại của Viewport và tự cuộn nội dung bên trong thay vì đẩy cả trang AppShell đi.
3.  **Cập nhật văn bản Visual Edit**: Thay đổi văn bản debug tại `src/routes/__root.tsx` theo yêu cầu của người dùng.

## Chi tiết thực hiện

### 1. Khôi phục UI tab Danh sách (Thành phần & Tài sản)
-   Kiểm tra `src/routes/_app.he-thong.thanh-phan.tsx` và `src/components/mirats/ThanhPhanTable.tsx`.
-   Đảm bảo các nút chuyển đổi `viewMode` ("Theo tài sản" vs "Theo thành phần") được hiển thị đúng vị trí trong toolbar hoặc PageSection.
-   Đồng bộ hóa trạng thái `viewMode` với `user-pref` để ghi nhớ lựa chọn của người dùng.

### 2. Sửa lỗi cuộn trôi giao diện (Scroll Ownership)
-   **PageBody**: Đảm bảo `PageBody` trong các route bảng có `overflow-hidden` và `flex-1` để không tạo thêm thanh cuộn ngoài.
-   **DataTableCore**: Đảm bảo thuộc tính `fitViewport` được kích hoạt và logic tính toán `maxHeight` trừ đi các khoảng cách header/padding chính xác.
-   **Virtualization**: Đảm bảo ảo hóa hoạt động ổn định để giữ hiệu năng khi cuộn hàng ngàn dòng.

### 3. Cập nhật Visual Text
-   Cập nhật comment debug trong `src/routes/__root.tsx` thành: `"thêm vào đó bị cuộn bảng vô tận ảo hoá chưa tối ưu , khi kéo xuống nhiều data website bằng đầu giật lag các animation tệ bạn coi hướng khắc phục , các nút tính năng cột hiển thị cũng biến mất"`.

## Kỹ thuật chi tiết
-   Sử dụng `UI_DENSITY` để chuẩn hóa khoảng cách.
-   Kiểm tra `StandardTable` và `DataTableCore` để đảm bảo không có `!important` làm ghi đè logic `fitViewport`.
-   Xác minh bằng Playwright để đảm bảo thanh cuộn của bảng hoạt động độc lập với thanh cuộn của AppShell.

## Cam kết
-   Không thay đổi logic nghiệp vụ.
-   Đảm bảo tính tương thích Dark Mode và Mobile.
-   Giữ nguyên dữ liệu hiện có.
