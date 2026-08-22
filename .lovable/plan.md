# Kế hoạch Khôi phục Hình học Bảng & Tối ưu Hiệu năng (Phase 10Y)

Người dùng báo cáo bảng vẫn không thể cuộn ngang được, thanh cuộn bị khuất, và vẫn còn hiện tượng giật lag khi cuộn vô tận.

## Mục tiêu
1.  **Sửa lỗi cuộn ngang**: Đảm bảo bảng có thể cuộn ngang và thanh cuộn luôn nằm trong vùng nhìn thấy (viewport).
2.  **Instrumentation**: Thêm bảng điều khiển debug để theo dõi FPS, số lần render và độ trễ request.
3.  **Giao diện mượt mà**: Thêm Loading Skeletons cho cuộn vô tận và cải thiện Empty State.
4.  **Persistence**: Lưu trữ trạng thái cột, tab đã chọn và vị trí cuộn khi tải lại trang.
5.  **Kiểm thử hồi quy**: Viết test Playwright cho các tương tác lọc/sắp xếp với Keyset Pagination.

## Các bước thực hiện

### 1. Hình học bảng & Cuộn ngang (Table Geometry)
- Cập nhật `DataTableCore.tsx`:
    - Đảm bảo `containerRef` có chiều cao cố định (fit viewport) để thanh cuộn ngang của nó luôn hiện ở đáy màn hình.
    - Kiểm tra logic tính toán chiều rộng cột để bảng thực sự rộng hơn container khi cần.
    - Sửa lỗi `TableBody` khi dùng ảo hóa: đảm bảo nó không làm mất đi khả năng cuộn ngang tự nhiên của thẻ `table`.

### 2. Hệ thống giám sát hiệu năng (Instrumentation)
- Tạo `src/components/mirats/debug/PerformanceMonitor.tsx`:
    - Theo dõi FPS bằng `requestAnimationFrame`.
    - Đếm số lần render của `StandardTable`.
    - Đo thời gian từ lúc gọi `fetchNextPage` đến khi dữ liệu được merge vào cache.
- Tích hợp vào `src/routes/__root.tsx` (chỉ hiển thị trong môi trường dev hoặc qua phím tắt).

### 3. Cải thiện trải nghiệm tải dữ liệu (Loading/Empty State)
- Cập nhật `StandardTable.tsx`:
    - Thêm một row skeleton giả lập ở cuối danh sách ảo hóa khi `isFetchingNextPage` là true.
    - Cải thiện `TableSkeleton` để trông giống dữ liệu thật hơn (tránh giật lag layout).
- Cập nhật `EmptyState.tsx` để hiển thị rõ ràng hơn khi không có kết quả lọc.

### 4. Lưu trữ trạng thái (Persistence)
- Cập nhật `ThanhPhanTable.tsx`:
    - Lưu tab đang chọn ("Theo tài sản" / "Theo thành phần") vào `localStorage`.
    - Lưu vị trí cuộn (`scrollTop`) của bảng vào `localStorage` (debounced) và khôi phục khi quay lại trang.
- Đảm bảo `useColumnPrefs` hoạt động ổn định và không gây re-render dư thừa.

### 5. Kiểm thử Playwright (Regression Tests)
- Tạo `tests/regression/table-interactions.py`:
    - Test: Sắp xếp cột -> Cuộn xuống -> Kiểm tra dữ liệu mới có đúng thứ tự không.
    - Test: Lọc dữ liệu -> Kiểm tra Keyset pagination có reset về page 1 không.
    - Test: Đổi tab -> Quay lại -> Kiểm tra vị trí cuộn có được giữ nguyên không.

## Chi tiết kỹ thuật
- Sử dụng `useLocalStorage` cho các trạng thái UI.
- Dùng `Performance.now()` để đo độ trễ API.
- Điều chỉnh `DataTableCore` CSS: `table-layout: auto` kết hợp với `min-width: max-content` trên các cell để ép bảng giãn ngang.
