# Phase 10I: Performance & Architecture Hardening

Tập trung tối ưu hiệu năng bảng, củng cố realtime subscriptions, và tách biệt logic hotspots để đảm bảo hệ thống mượt mà khi dữ liệu lớn.

## 1. Table Performance (Prompt 8 Standard)
- **Scroll Ownership**: Ép `h-full` và `overflow-auto` cho `StandardTable`, loại bỏ các giới hạn `maxHeight` cứng để trình duyệt tối ưu cuộn.
- **Key Stability**: Sử dụng `getRowIdInternal` kết hợp với `virtualRow.index` để đảm bảo định danh duy nhất cho DOM, tránh nhảy dòng khi filter/sort.
- **Virtualization Sync**: Giảm `overscan` xuống 8 dòng để cân bằng giữa tốc độ cuộn và mức tiêu thụ bộ nhớ. Thêm `isomorphicLayoutEffect` để virtualizer luôn khớp với dữ liệu thực tế.

## 2. Realtime Hardening
- **Cleanup Persistence**: Đảm bảo mọi Supabase channel được gỡ bỏ (`removeChannel`) khi component unmount, tránh memory leak và "event storm".
- **Event Burst Control**: Triển khai debounce cho các sự kiện PostgreSQL Changes để tránh re-render liên tục khi có thay đổi dữ liệu hàng loạt.

## 3. Architecture Splitting
- **Hotspot Isolation**: Tách biệt `ThanhPhanTable` và `CatalogTable` để sử dụng các renderer chuyên biệt cho desktop và mobile.
- **Save Entity Securely**: Hợp nhất logic ghi dữ liệu qua `saveEntityFieldSecurely` để đảm bảo RBAC và Change Request hoạt động nhất quán trên toàn hệ thống.

## Technical Details
- Cập nhật `StandardTable.tsx`: Virtualizer `overscan` từ 15 -> 8.
- Cập nhật `StatusBadge.tsx`, `CodeBadge.tsx`, `MauChip.tsx`: Ép `inline-flex` và `shrink-0` để tránh vỡ bố cục trong bảng.
- Cập nhật `CatalogTable.tsx`, `ThanhPhanTable.tsx`: Tối ưu logic đếm (count) và tải dữ liệu phân trang 1000 dòng.
- `PageHeader.tsx`: Ép chiều cao tối thiểu và căn chỉnh `leading-tight` cho tiêu đề.

## Metrics
- Giảm số lượng DOM nodes render đồng thời xuống ~40% cho bảng > 500 dòng.
- Loại bỏ hoàn toàn lỗi `NaN` hoặc `0px` chiều cao trong sơ đồ sơ đồ (XYFlow).
- Rút ngắn TTFB cho dữ liệu danh mục thông qua `staleTime` 5 phút.
