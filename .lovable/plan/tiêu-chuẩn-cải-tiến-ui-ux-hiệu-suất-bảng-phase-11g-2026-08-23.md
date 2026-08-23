# Tiêu chuẩn Cải tiến UI/UX & Hiệu suất Bảng (Phase 11G)

Cải thiện cơ chế cuộn vô tận, đồng nhất nhãn hiển thị và nâng cấp trạng thái phản hồi của các bảng dữ liệu chính.

## Thay đổi kỹ thuật

### 1. Cập nhật Lộ trình (Roadmap)
- Thay đổi văn bản tooltip và nhãn hỗ trợ (aria-label) trong `TopBar.tsx` và `TzClock.tsx` bằng nội dung yêu cầu nguyên văn (Vietnamese).

### 2. Khóa Tải Trùng & Tối ưu Cuộn (Performance)
- Cập nhật `StandardTable.tsx`: Thêm kiểm tra `isFetchingNextPage` và `hasNextPage` trước khi gọi `fetchNextPage` để tránh gửi nhiều yêu cầu đồng thời khi người dùng cuộn nhanh.
- Điều chỉnh điểm kích hoạt (threshold) dựa trên số lượng dòng hiện có để đảm bảo dữ liệu mới được nạp trước khi người dùng chạm đáy.

### 3. Chuẩn hóa Microcopy & Nhãn (UX Consistency)
- Rà soát `ComponentTablePanel.tsx`, `AssetTablePanel.tsx` và `StandardTable.tsx`:
  - Loại bỏ các đề cập đến giới hạn "500" dòng (từ các giai đoạn cũ).
  - Cập nhật định dạng nhãn "Đã tải X / Y" để hiển thị chính xác tổng số bản ghi từ API (Keyset Pagination).

### 4. Nâng cấp Loading/Empty/Error States
- Sử dụng `TableSkeleton` và `EmptyState` chuẩn MIRATS trong `StandardTable.tsx`.
- Cải thiện hiển thị lỗi bằng cách tích hợp `thongDiepLoi` và nút "Thử lại" (Retry) trực quan hơn.

## Danh sách tệp tin thay đổi
- `src/components/mirats/app-shell/TopBar.tsx`: Cập nhật văn bản lộ trình.
- `src/components/mirats/TzClock.tsx`: Cập nhật văn bản lộ trình.
- `src/components/mirats/StandardTable.tsx`: Khóa tải trùng, nâng cấp states.
- `src/components/mirats/inventory/ComponentTablePanel.tsx`: Chuẩn hóa nhãn số lượng.
- `src/components/mirats/inventory/AssetTablePanel.tsx`: Chuẩn hóa nhãn số lượng.

## Hướng dẫn kiểm thử (Playwright)
- Kiểm tra việc cuộn xuống dưới cùng của danh sách tài sản/thành phần.
- Xác nhận không có lỗi "429 Too Many Requests" hoặc lag do fetch trùng lặp.
- Kiểm tra hiển thị khi không tìm thấy kết quả (Empty State).
