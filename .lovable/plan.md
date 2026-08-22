# Kế hoạch Khôi phục Hình học Bảng & Tối ưu Hiệu năng (Phase 10Y)

Người dùng báo cáo bảng vẫn không thể cuộn ngang được, thanh cuộn bị khuất, và vẫn còn hiện tượng giật lag khi cuộn vô tận.

## Mục tiêu
1.  **Sửa lỗi cuộn ngang & Geometry**: Đảm bảo bảng có thể cuộn ngang mượt mà, thanh cuộn luôn trong viewport. Sử dụng `table-layout: fixed` kết hợp tính toán chiều rộng để giảm tải cho trình duyệt khi vẽ bảng lớn.
2.  **Tối ưu FPS triệt để (Deep Optimization)**: 
    - Thay thế `translateY` bằng `will-change: transform` và `transform: translate3d` để tận dụng GPU.
    - Memoize các thành phần Cell ở mức cực độ, ngăn chặn re-render tuyệt đối nếu dữ liệu không đổi.
    - Giảm số lượng DOM nodes bằng cách tinh gọn các wrapper component bên trong bảng.
3.  **Giao diện mượt mà & Persistence**: Thêm Loading Skeletons mượt và lưu vị trí cuộn để tránh nhảy trang.
4.  **Kiểm thử thực tế**: Dùng Playwright giả lập máy cấu hình thấp để đo độ trễ và tối ưu cho đến khi không còn giật lag.


## Các bước thực hiện

### 1. Hình học bảng & Cuộn ngang (Table Geometry)
- Cập nhật `DataTableCore.tsx`:
    - Đảm bảo `containerRef` có chiều cao cố định (fit viewport) để thanh cuộn ngang của nó luôn hiện ở đáy màn hình.
    - Kiểm tra logic tính toán chiều rộng cột để bảng thực sự rộng hơn container khi cần.
    - Sửa lỗi `TableBody` khi dùng ảo hóa: đảm bảo nó không làm mất đi khả năng cuộn ngang tự nhiên của thẻ `table`.

### 2. Tối ưu FPS triệt để (Deep Optimization)
- Cập nhật `StandardTable.tsx` & `DataTableCore.tsx`:
    - Sử dụng `transform: translate3d(0, ${start}px, 0)` để kích hoạt hardware acceleration (GPU).
    - Thêm `will-change: transform` vào các row đang được ảo hóa.
    - Memoize `TableCell` và nội dung render bên trong để tránh re-render khi cuộn (scroll-only re-renders).
    - Tinh gọn DOM: Loại bỏ các thẻ `div` bọc không cần thiết trong `StandardTable`.
- Giảm `overscan` xuống mức tối thiểu (ví dụ: 5) nếu CPU máy yếu bị quá tải khi render quá nhiều row ẩn.

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
