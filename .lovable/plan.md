# Plan: Inventory Performance & Architecture Optimization (Phase 10X - 10Z)

Tiếp tục tối ưu hóa hệ thống bảng Thành phần & Tài sản để đạt hiệu năng tối đa (60 FPS) trên thiết bị yếu, đảm bảo tính toàn vẹn của dữ liệu qua phân trang server-side và chuẩn hóa hình học cuộn "Một Scroll Owner".

## User Review Required

> [!IMPORTANT]
> Việc chuyển đổi sang **Server-side Filtering** hoàn toàn đòi hỏi các View/RPC phía backend phải hỗ trợ đầy đủ các tham số lọc (`q`, `bucket`, `status`). Nếu backend chưa sẵn sàng, hệ thống sẽ fallback lọc tại client trên buffer 100 dòng kèm cảnh báo.

## Technical Details

### Phase 2: Server-Side Pipeline
- Tách Query State: Định nghĩa `ComponentQuery` và `AssetQuery` riêng biệt.
- Debounce: Áp dụng `use-debounce` (300ms) cho ô tìm kiếm để tránh bão request.
- Keyset logic: Cập nhật `fetchKeyset` để ưu tiên `q` và `filters` trước khi áp dụng cursor.
- Reset Behavior: Khi thay đổi query state, thực hiện: reset cursor, cancel request cũ, cuộn bảng về đầu.

### Phase 3: Scroll Ownership (Locking the Workspace)
- Cập nhật `PageFrame`: Thêm variant `layout="workspace"` (`h-full min-h-0 overflow-hidden`).
- Fix Height Chain: Đảm bảo chuỗi kế thừa chiều cao từ `AppShell` -> `PageFrame` -> `PageBody` -> `StandardTable` không bị đứt đoạn.
- `overscroll-behavior: contain`: Ngăn chặn cuộn trang web khi đã cuộn hết bảng.

### Phase 4: Horizontal Scroll Rail
- Phát triển component `HorizontalScrollRail`:
    - Vị trí `sticky` tại đáy vùng nhìn thấy của bảng.
    - Đồng bộ 2 chiều: `scrollLeft` của bảng <-> Vị trí thumb của rail.
    - Hỗ trợ kéo (drag) và phím mũi tên.

### Phase 5: Render Optimization (Low-end Device focus)
- Memoization: Sử dụng `React.memo` cho `OptimizedCell` và `TableRow`.
- Default Columns: Giới hạn 6-8 cột chính (Tên, Mã, Trạng thái, Model) để giảm DOM nodes.
- GPU Acceleration: Áp dụng `translate3d(0,0,0)` và `will-change: transform` cho từng hàng.
- Virtualizer: Tinh chỉnh `adaptive overscan` dựa trên FPS thực tế.

### Phase 6: Loading UX
- Tích hợp Skeleton mượt mà ngay trong viewport của bảng.
- Hiển thị trạng thái "Đã tải X / Y" chính xác theo filter hiện tại.

## Verification Plan

### Automated Tests
- `npm run build:dev` & `npm run typecheck`.
- Playwright script:
    - Kiểm tra mode Asset: 0 request Component.
    - Kiểm tra cuộn vô tận: Không trùng lặp ID qua 5 batch.
    - Kiểm tra cuộn ngang: Rail luôn hiển thị khi bảng rộng hơn viewport.

### Manual Verification
- Kiểm tra trên các thiết bị mobile/tablet (zoom 100-200%).
- Kiểm tra hiệu năng bằng Chrome Profiler: Đảm bảo Scripting time giảm > 30% khi cuộn.
