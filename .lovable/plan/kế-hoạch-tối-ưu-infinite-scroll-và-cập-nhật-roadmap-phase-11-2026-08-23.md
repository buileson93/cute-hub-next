# Kế hoạch Tối ưu Infinite Scroll và Cập nhật Roadmap (Phase 11F)

Người dùng yêu cầu điều chỉnh cơ chế tải dữ liệu từ giới hạn cứng 500 dòng (có nút "Tải hết") về cơ chế cuộn vô tận mượt mà với 100 dòng mỗi lần tải, đảm bảo hiệu suất không giật lag. Đồng thời cập nhật văn bản Roadmap vào hệ thống.

## Thay đổi chính

### 1. Cập nhật Roadmap (Visual Text Edits)
- Thay đổi văn bản hiển thị trong `aria-label` của `TzClock.tsx` và tooltip của `TopBar.tsx` thành nội dung tiếng Việt mới theo yêu cầu: *"việc tải dữ liệu bạn giới hạn ở 100 thôi như khi cuộn xuống đấy rồi tải thêm ko phải giới hạn như bây giờ là 500 rồi có nút tải thêm lên phương án tối ưu đảm bảo không làm giật lag và và người dùng tối ưu hơn"*.

### 2. Tối ưu cơ chế Tải dữ liệu (Infinite Scroll Refactor)
- **src/components/mirats/ThanhPhanTable.tsx**:
    - Điều chỉnh `kichThuoc` (pageSize) từ `500` về `100` trong các hook `useInfiniteTaiSanRows` và `useInfiniteThanhPhanRows`.
    - Điều này giúp giảm tải cho database và client, tăng tốc độ hiển thị ban đầu.
- **src/components/mirats/StandardTable.tsx**:
    - Loại bỏ nút "Tải hết tất cả" (Fetch All) khỏi phần footer của bảng.
    - Xóa `fetchAll` khỏi `StandardTableProps` để dọn dẹp API.
    - Giữ nguyên cơ chế `adaptiveOverscan` (GPU acceleration) đã triển khai để đảm bảo cuộn 100 dòng không bị giật lag.

## Chi tiết kỹ thuật

### Bảng Thành phần & Tài sản
- Cập nhật tham số `kichThuoc: 100` trong hàm `fetchKeyset`.
- Đảm bảo `getNextPageParam` vẫn hoạt động chính xác dựa trên cursor của Supabase Keyset Pagination.

### Bảng tiêu chuẩn (StandardTable)
- Xóa bỏ logic render nút `fetchAll` trong footer.
- Tối ưu lại điểm kích hoạt `fetchNextPage` (threshold) nếu cần để việc tải diễn ra "tàng hình" trước khi người dùng chạm đáy.

## Kiểm tra
- Xác nhận dữ liệu tải theo từng block 100 dòng khi cuộn.
- Kiểm tra hiệu suất cuộn trên thiết bị cấu hình thấp (thông qua `adaptiveOverscan` telemetry).
- Kiểm tra hiển thị văn bản Roadmap trong tooltip đồng hồ.
