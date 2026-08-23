# Lập kế hoạch Phase 11I: Tối ưu hóa hiệu năng Virtualization & Đảm bảo tính toàn vẹn dữ liệu Cuộn vô tận

Phase này tập trung vào việc nâng cao độ tin cậy của hệ thống bảng ảo hóa, triển khai các cơ chế bảo vệ chống trùng lặp dữ liệu, và cải thiện trải nghiệm người dùng thông qua việc khôi phục vị trí cuộn.

## Các thay đổi chính

### 1. Cập nhật Roadmap UI (Visual Edits)
- Thay đổi văn bản trong Tooltip của `TopBar.tsx` và `aria-label` của `TzClock.tsx` sang nội dung lộ trình mới tiếng Việt.

### 2. Tối ưu hóa Virtualization & Stress Testing
- **Adaptive Overscan**: Cải thiện logic trong `StandardTable.tsx` để tự động điều chỉnh `overscan` dựa trên FPS thực tế, đảm bảo luôn giữ mức 60fps khi record tăng lên hàng nghìn.
- **GPU Acceleration**: Đảm bảo sử dụng `translate3d` cho tất cả các hàng ảo hóa để tận dụng tăng tốc phần cứng.

### 3. Khôi phục vị trí cuộn (Scroll Restoration)
- Triển khai cơ chế lưu `scrollOffset` của `StandardTable` vào bộ nhớ đệm (dựa trên `tableKey`).
- Tự động khôi phục vị trí cuộn khi người dùng quay lại tab hoặc thay đổi bộ lọc/sắp xếp mà vẫn giữ nguyên tập dữ liệu.

### 4. Chống trùng lặp dữ liệu (Deduplication)
- Bổ sung logic dedupe (theo ID) trong `StandardTable` trước khi render để xử lý trường hợp API trả về trùng bản ghi khi cuộn nhanh hoặc có thay đổi dữ liệu đồng thời.
- Hiển thị trạng thái lỗi rõ ràng (Network Error) với nút thử lại (Retry) tích hợp trực tiếp vào vùng cuộn.

### 5. Kiểm thử E2E Playwright (Integrity Guard)
- Cập nhật `tests/table-integrity.test.py` để:
    - Đo số lượng frame bị drop khi cuộn nhanh.
    - Xác nhận không có ID trùng lặp sau khi tải >500 records.
    - Kiểm tra tính ổn định của Keyset Pagination với pageSize 100.

## Chi tiết kỹ thuật

### Tệp tin thay đổi
- `src/components/mirats/StandardTable.tsx`: Logic scroll restoration, deduplication, và adaptive virtualization.
- `src/components/mirats/app-shell/TopBar.tsx`: Cập nhật roadmap text.
- `src/components/mirats/TzClock.tsx`: Cập nhật roadmap text.
- `src/lib/mirats/db/keyset-supabase.ts`: Bổ sung logging/telemetry cho các trường hợp fetch trùng.
- `tests/table-integrity.test.py`: Nâng cấp bộ test suite.

### Các bước thực hiện
1. Cập nhật văn bản Roadmap trong `TopBar.tsx` và `TzClock.tsx`.
2. Sửa `StandardTable.tsx` để tích hợp `scrollOffset` cache.
3. Thêm logic `useMemo` để lọc trùng `rows` dựa trên `getRowIdInternal`.
4. Cải thiện `StandardTable` error boundary để hỗ trợ `infiniteScroll.fetchNextPage` retry.
5. Chạy stress test Playwright để xác nhận hiệu năng 60fps.
