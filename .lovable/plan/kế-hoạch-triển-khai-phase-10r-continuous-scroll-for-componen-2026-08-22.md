# Kế hoạch triển khai Phase 10R: Continuous Scroll for Components & Assets

Triển khai chế độ cuộn liên tục (Infinite Scroll) cho màn hình "Thành phần & Tài sản", loại bỏ hoàn toàn phân trang thủ công và tối ưu hóa việc nạp dữ liệu từ server.

## 1. Mục tiêu và Tiêu chí hoàn thành
- Loại bỏ các điều khiển phân trang (Page Size, Next/Prev) tại `ThanhPhanTable.tsx`.
- Dữ liệu được nạp theo lô (batch 100-300 dòng) khi người dùng cuộn gần cuối danh sách.
- Sử dụng nạp dữ liệu phía server (Server-side paging) thay vì nạp toàn bộ 10.000 dòng.
- Đảm bảo tính nhất quán của dữ liệu (không trùng/mất dòng) thông qua Keyset Cursor.
- Tích hợp ảo hóa (Virtualization) để đảm bảo hiệu năng DOM.

## 2. Chi tiết kỹ thuật

### Giai đoạn 0: Môi trường Kiểm thử
- Viết bài kiểm tra (test) xác minh chế độ nạp vô hạn:
    - Chỉ batch đầu tiên được gọi khi mount.
    - Không hiển thị các điều khiển phân trang cũ.
    - `fetchNextPage` được gọi chính xác khi cuộn tới ngưỡng (threshold).
    - Mode `component` và `asset` hoạt động độc lập, không nạp dư thừa.

### Giai đoạn 1: Infinite Data Hooks
- Chuyển đổi `useThanhPhanRows` và `useTaiSanRows` sang `useInfiniteQuery` của TanStack Query.
- Cấu trúc trả về: `rows` (flattened), `hasNextPage`, `fetchNextPage`, `isFetchingNextPage`.
- Chỉ kích hoạt (enable) hook tương ứng với `viewMode` hiện tại.

### Giai đoạn 2: Keyset Pagination Adapter
- Sử dụng `fetchKeyset` từ `src/lib/mirats/db/keyset-supabase.ts`.
- Mặc định batch size: 200 rows.
- Đảm bảo sắp xếp ổn định với `(sortField, id)`.

### Giai đoạn 3: Refactor UI Components
- **`ThanhPhanTable.tsx`**:
    - Xóa các state: `pageSize`, `page`, `totalPages`.
    - Xóa các UI controls phân trang trong toolbar.
    - Cập nhật hiển thị số lượng: "Đã tải X / Tổng Y".
- **`StandardTable.tsx`**:
    - Thêm prop `dataMode={{ kind: "infinite", ... }}`.
    - Tích hợp logic gọi `fetchNextPage` từ Virtualizer (onRangeChanged hoặc effect).
    - Hiển thị footer trạng thái (Loading more, End of list, Retry error).

### Giai đoạn 4: UX & Performance
- Debounce tìm kiếm phía server.
- Reset infinite query và cuộn về đầu khi đổi Sort/Filter/Bucket.
- Giữ URL params cho các trạng thái lọc/tìm kiếm.
- Cập nhật `StandardTable` để scrollbar ngang luôn ở đáy vùng nhìn thấy (Prompt 10Q integration).

## 3. Các file thay đổi chính
- `src/components/mirats/ThanhPhanTable.tsx`: Refactor hooks và UI controls.
- `src/components/mirats/StandardTable.tsx`: Tích hợp infinite scroll logic.
- `src/components/mirats/TzClock.tsx`: Cập nhật nhãn Phase 10R.

## 4. Kế hoạch kiểm tra
- Kiểm tra với dataset > 1.000 dòng để xác minh nạp batch.
- Kiểm tra chuyển đổi giữa Component/Asset mode.
- Kiểm tra selection/export trong ngữ cảnh dữ liệu chưa tải hết.
- `npm run build` & `npm run ui:audit`.

## Technical Details (User-focused)
- Thay đổi cách nạp dữ liệu từ "tải một cục" sang "tải khi cuộn", giúp trang web nhẹ hơn và phản hồi nhanh hơn.
- Giao diện bảng sẽ gọn gàng hơn vì không còn các nút chuyển trang gây nhiễu.
- Dữ liệu luôn chính xác ngay cả khi có người khác đang thêm/xóa thiết bị trong hệ thống.
