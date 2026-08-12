# Kế hoạch sửa lỗi hiển thị Sơ đồ tư duy (MindMap)

Trang Cây hệ thống đang gặp 5 lỗi khiến tab "Sơ đồ" không hoạt động đúng hoặc hiển thị trống. Kế hoạch này sẽ khắc phục các lỗi đó dựa trên phân tích kỹ thuật và yêu cầu bảo toàn logic cũ.

## Các lỗi và Giải pháp

### 1. Lỗi state `expanded` đóng băng (CayMindMap.tsx)
- **Vấn đề**: `useState(initialExpanded)` chỉ lấy giá trị lúc render đầu (thường là mảng rỗng do đang tải dữ liệu). Khi dữ liệu về, `expanded` không tự cập nhật.
- **Giải pháp**: 
  - Sử dụng `useRef` để lưu "chữ ký" của `tree` (chuỗi ID các node).
  - Sử dụng `useEffect` để so sánh chữ ký mới với cũ. Nếu khác và người dùng chưa bấm đóng/mở node thủ công (`justOpenedRef.current === null`), sẽ cập nhật `expanded` từ `initialExpanded`.

### 2. Lỗi khung sơ đồ cao 0px (_app.he-thong.cay.tsx & PageBody.tsx)
- **Vấn đề**: `PageBody` thiếu `min-h-0` khiến con (`h-full`) không tính được chiều cao thực tế. `overflow-auto` gây xung đột với tính năng Pan/Zoom của React Flow.
- **Giải pháp**:
  - Cập nhật `_app.he-thong.cay.tsx`: Đảm bảo container bao ngoài `PageBody` là `flex flex-col min-h-0 flex-1`.
  - Loại bỏ `overflow-hidden` hoặc `overflow-auto` không cần thiết ở các lớp trung gian bao quanh MindMap.
  - Sử dụng mẫu: `<PageBody className="min-h-0 flex-1 flex flex-col">`.

### 3. Lỗi `isFiltering` luôn true (_app.he-thong.cay.tsx)
- **Vấn đề**: `badgeFilter` là object nên `!!badgeFilter` luôn trả về `true`.
- **Giải pháp**:
  - Sử dụng hàm `badgeFilterActive(f)` từ `utils.ts` để kiểm tra chính xác bộ lọc có đang hoạt động không (dựa trên `size` của Set).
  - Cập nhật nút "Xoá tìm kiếm" để thực hiện `setBadgeFilter({ status: new Set(), imp: new Set() })`.

### 4. Lỗi không nhớ tab đang xem (_app.he-thong.cay.tsx & CayContext.tsx)
- **Vấn đề**: State `display` chỉ nằm ở Context, mất khi F5.
- **Giải pháp**:
  - Thêm `view` vào `validateSearch` của route (giá trị: `tree | mindmap | health | history`).
  - Đồng bộ `display` trong `HeThongCayPage` với search param. Khi người dùng chuyển tab, cập nhật cả search param qua `navigate`.

### 5. Kết nối Tìm kiếm vào Sơ đồ (CayMindMap.tsx & NodeSearch.tsx)
- **Vấn đề**: `NodeSearch.tsx` chưa được dùng. `CayMindMap` chưa phản ứng với `searchQuery`.
- **Giải pháp**:
  - Thay thế ô `Input` tìm kiếm đơn giản bằng component `NodeSearch` trong header.
  - Truyền `searchQuery` và `focus` từ `CayContext` vào `CayMindMap`.
  - Trong `CayMindMap`, khi có `focus` mới, tự động mở rộng các cấp tổ tiên và gọi `setCenter` / `fitView` để đưa node đó vào trung tâm màn hình.

## Chi tiết kỹ thuật

### Tệp sẽ chỉnh sửa:
1. `src/routes/_app.he-thong.cay.tsx`: 
   - Cấu trúc `validateSearch` và đồng bộ `view` param.
   - Layout của `PageBody` và `DataState`.
   - Thay `Input` bằng `NodeSearch`.
   - Logic `isFiltering` và nút xoá lọc.
2. `src/components/mirats/he-thong-cay/CayMindMap.tsx`:
   - Logic `useEffect` đồng bộ `expanded` khi `tree` thay đổi.
   - Tiếp nhận `searchQuery` và `focus` để xử lý highlight/zoom.
3. `src/components/mirats/he-thong-cay/CayContext.tsx`:
   - (Tuỳ chọn) Hỗ trợ khởi tạo `display` từ bên ngoài tốt hơn nếu cần.
4. `src/components/mirats/he-thong-cay/NodeSearch.tsx`:
   - Đảm bảo logic `normalize` và lọc hoạt động tốt với toàn bộ cây.

## Kiểm tra (Checklist)
1. Truy cập `/he-thong/cay?view=mindmap` hiển thị đúng sơ đồ.
2. Element `.react-flow` có `height > 0`.
3. Pan/Zoom và đóng mở node hoạt động mượt mà.
4. Tìm kiếm node trong MindMap sẽ tự động zoom tới node đó.
5. F5 giữ đúng tab đang xem.
6. `npx tsc --noEmit` không có lỗi.
