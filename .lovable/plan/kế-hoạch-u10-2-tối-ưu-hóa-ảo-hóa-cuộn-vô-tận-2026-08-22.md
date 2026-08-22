---
name: U10.2 - Infinite Scroll & Virtualization Refactor
description: Khắc phục lỗi ảo hóa trong StandardTable và triển khai Infinite Scroll cho DataTableCore.
type: feature
---

# Kế hoạch U10.2: Tối ưu hóa ảo hóa & Cuộn vô tận

Mục tiêu: Đảm bảo hiệu năng hiển thị hàng chục ngàn dòng dữ liệu mà không làm giảm trải nghiệm người dùng. DOM chỉ render các dòng đang nhìn thấy (Windowing/Virtualization) và hỗ trợ cuộn liên tục thay vì phân trang truyền thống.

## Tình trạng hiện tại (Audit Findings)

1.  **StandardTable.tsx:**
    - Sử dụng `@tanstack/react-virtual` nhưng bị xung đột với `clientPagination`. Khi bật phân trang, virtualizer chỉ nhận được số dòng của 1 trang (vd: 50 dòng), dẫn đến việc không thể cuộn qua toàn bộ dữ liệu.
    - Lỗi logic render: `const r = rows[virtualRow.index]` trong vòng lặp ảo hóa là sai vì `virtualRow.index` tương ứng với mảng đã qua xử lý (`display`), không phải mảng gốc (`rows`).
    - Multiple Scroll Containers: Cả `Card`, `RawTableWrapper` và `parentRef` đều có thể có `overflow-auto`, làm Virtualizer tính toán sai vị trí cuộn.

2.  **DataTableCore.tsx:**
    - Hiện đang render 100% rows vào DOM. Chưa có ảo hóa.

## PHA 1: Xác định & Xác minh (Systematic Debugging)

1.  **Phân loại màn hình sử dụng:**
    - `client-all` (Tải hết): `/tai-lieu`, `/thiet-bi/danh-sach` (dữ liệu từ `useDbTaxonomy`).
    - `server-page` (Phân trang backend): `admin.audit.tsx`, `_app.su-co.index.tsx`.
    - `infinite` (Cần Infinite Scroll): Danh sách thiết bị lớn, nhật ký hệ thống.

2.  **Tạo bài test kiểm chứng (TDD):**
    - Tạo `src/components/mirats/__tests__/virtualization-integrity.test.tsx`.
    - Test Case 1: Khi có 10.000 dòng, số lượng `<tr>` trong DOM không được vượt quá `viewportHeight / rowHeight + overscan`.
    - Test Case 2: Khi sort/filter, dữ liệu hiển thị tại `virtualRow.index` phải khớp với mảng `display`, không phải `rows` gốc.
    - Test Case 3: Xác nhận `parentRef` là scroll owner duy nhất.

3.  **Báo cáo Root Cause:** Phân tích chi tiết từng lỗi render NaN hoặc sai lệch index sau filter.

## PHA 2: Tái cấu trúc StandardTable (Backward Compatibility)

1.  **Sửa logic Index:**
    - Thay đổi nguồn dữ liệu ảo hóa: `count: fullDisplay.length`.
    - Truy xuất dòng: `const row = fullDisplay[virtualRow.index]`.

2.  **Hợp nhất Scroll Owner:**
    - Loại bỏ các lớp `overflow-auto` dư thừa ở component cha.
    - Đảm bảo `parentRef` bao bọc trực tiếp phần `<table>`.

3.  **Tích hợp Auto-Expand khi Search:**
    - Khi có filter search, tự động đưa các dòng khớp vào trạng thái hiển thị (nếu là bảng tree/grouped).

## PHA 3: Nâng cấp DataTableCore (Modern Architecture)

1.  **Triển khai `@tanstack/react-virtual` vào DataTableCore:**
    - Hỗ trợ prop `virtualize?: boolean`.
    - Tự động tính toán `estimateSize` dựa trên `density`.

2.  **Infinite Scroll API:**
    - Hỗ trợ prop `onLoadMore?: () => void` và `hasMore?: boolean`.
    - Tích hợp `IntersectionObserver` ở cuối danh sách ảo hóa để kích hoạt tải thêm.

3.  **Smooth Scrolling:**
    - Tối ưu CSS scrollbar (Apple-style, 4px) để không che lấp nội dung cột sticky.

## Tiêu chí nghiệm thu (Verification)

- [ ] DOM Inspect: Dưới 100 phần tử `<tr>` cho danh sách 10.000 dòng.
- [ ] Không có lỗi `NaN` trong style `transform` của hàng.
- [ ] Cuộn mượt mà ở tốc độ cao, không bị trắng trang (overscan hợp lý).
- [ ] Sticky header và sticky columns (Mã thiết bị) vẫn giữ đúng vị trí khi cuộn ngang/dọc.
- [ ] Selection và Expand row hoạt động chính xác với virtualization.
