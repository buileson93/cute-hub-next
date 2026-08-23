# Kế hoạch Tối ưu hóa Hiệu năng & Scroll Bảng (Phase 10Z+)

Chúng tôi tập trung vào việc giải quyết tình trạng giật lag khi cuộn bảng lớn (Infinite Scroll) và đảm bảo cấu trúc hình học của trang (Page Geometry) luôn ổn định, đặc biệt là trên các thiết bị cấu hình yếu.

## Mục tiêu
- **Một Scroll Owner duy nhất**: Chỉ vùng nội dung bảng được cuộn, Header và Toolbar luôn cố định.
- **Tối ưu hóa GPU**: Sử dụng hardware acceleration để giảm tải cho CPU khi render hàng ngàn ô dữ liệu.
- **Mount-on-Demand**: Chỉ tải dữ liệu và chạy logic cho Tab đang hiển thị để tiết kiệm tài nguyên.
- **Duy trì Trạng thái**: Giữ nguyên lựa chọn cột và vị trí cuộn khi chuyển đổi giữa các tab.

## Các bước thực hiện

### Giai đoạn 1: Chuẩn hóa Hình học & Scroll Ownership
- [x] **PageFrame**: Thay thế `min-h-screen` bằng `h-full` để ngăn trang bị đẩy ra ngoài vùng nhìn thấy.
- [x] **AppShell**: Khóa `overflow` của container chính, nhường quyền cuộn cho Workspace.
- [x] **StandardTable**: Thiết lập container cuộn chuyên dụng với `will-change: transform` và `translate3d`.
- [x] **CSS Scroll Rail**: Tùy chỉnh thanh cuộn ngang luôn hiển thị ở đáy vùng nhìn thấy.

### Giai đoạn 2: Tối ưu hóa Rendering (Mount-on-Demand)
- [ ] **ThanhPhanTable Refactor**: 
    - Chia tách thành 2 panel độc lập: `ComponentTablePanel` và `AssetTablePanel`.
    - Chỉ mount panel tương ứng với `viewMode` hiện tại.
    - Tự động hủy (Abort) các request cũ khi người dùng chuyển tab nhanh.
- [ ] **Adaptive Virtualization**:
    - Điều chỉnh `overscan` dựa trên tốc độ cuộn thực tế.
    - Memoization cho `OptimizedCell` để tránh render lại không cần thiết.

### Giai đoạn 3: Server-side Filtering & Paging
- [x] **fetchKeyset**: Tích hợp `AbortSignal` và server-side filters (`q`, `bucket`).
- [x] **Query Hooks**: Chuyển logic tìm kiếm từ client lên server để giảm kích thước payload.

### Giai đoạn 4: Kiểm tra & Xác nhận
- [ ] Chạy Playwright test đo FPS khi cuộn sâu (> 500 dòng).
- [ ] Kiểm tra rò rỉ bộ nhớ (Memory Leak) sau 5 phút thao tác liên tục.
- [ ] Xác nhận Header/Tabs không bị trôi khi cuộn dọc.

## Chi tiết kỹ thuật
- **GPU Acceleration**: `contain: content` và `transform: translate3d(0,0,0)`.
- **Keyset Pagination**: Sử dụng cursor-based paging để đảm bảo hiệu năng không đổi bất kể độ sâu của dữ liệu.
- **AbortController**: Ngăn chặn tình trạng "race condition" khi cập nhật UI.
