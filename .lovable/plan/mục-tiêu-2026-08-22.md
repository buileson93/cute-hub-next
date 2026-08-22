---
name: Phase 10Z - Tối ưu ảo hóa chuyên sâu & Ổn định Layout
description: Tối ưu hóa thuật toán ảo hóa, giảm số lượng DOM node, đảm bảo layout cố định không bị trôi và duy trì các cột thông tin quan trọng.
type: feature
---

## Mục tiêu
1.  **Tối ưu hóa ảo hóa (Virtualization Tuning)**: Giảm thiểu số lượng phần tử render không cần thiết, sử dụng thuật toán windowing để đạt hiệu năng mượt mà nhất trên máy yếu.
2.  **Duy trì Layout ổn định (Layout Stability)**: Đảm bảo bảng có "Scroll Owner" riêng, không gây cuộn toàn trang làm mất Header/Sidebar.
3.  **Cố định thông tin (Sticky persistence)**: Đảm bảo các hàng tiêu đề và cột định danh quan trọng luôn hiển thị khi cuộn.
4.  **Kiểm soát hiệu năng**: Thực hiện các phép đo (benchmarking) để đảm bảo FPS ổn định.

## Các kỹ thuật đề xuất
- **Adaptive Overscan**: Điều chỉnh số lượng hàng "đệm" dựa trên tốc độ cuộn của người dùng.
- **Node Recycling (trong React)**: Sử dụng các `key` ổn định để React reuse DOM nodes hiệu quả nhất.
- **Containment Strategy**: Áp dụng `contain: strict` hoặc `content` cho container bảng để cách ly quá trình tính toán layout.
- **Scroll Hijacking Protection**: Ngăn chặn sự kiện cuộn bảng lan ra (bubble) làm trôi trang web.
- **CSS GPU Layer Promotion**: Ép các hàng virtualized vào layer GPU riêng biệt để giảm gánh nặng cho Main Thread.

## Các bước thực hiện
1.  **Cập nhật nhãn trạng thái (Visual Text Edits)**:
    - Thay thế nội dung debug trong `src/routes/__root.tsx` bằng văn bản yêu cầu của người dùng.
2.  **Tối ưu thuật toán trong `DataTableCore.tsx`**:
    - Tinh chỉnh `rowVirtualizer` từ `@tanstack/react-virtual`.
    - Thêm logic xử lý động cho `overscan`.
3.  **Cố định hình học (Geometry Fix)**:
    - Đảm bảo `DataTableCore` có một `max-height` xác định (thường là `calc(100vh - header_height)`).
    - Kiểm tra và sửa lỗi nếu thanh cuộn ngang bị ẩn dưới mép màn hình.
4.  **Kiểm tra & Đo lường**:
    - Sử dụng script đo FPS khi cuộn nhanh.
    - Kiểm tra trên trình duyệt mobile để đảm bảo tính năng sticky hoạt động ổn định.

## Chi tiết kỹ thuật
- **File ảnh hưởng**: `src/components/mirats/DataTableCore.tsx`, `src/components/mirats/StandardTable.tsx`, `src/routes/__root.tsx`.
- **Thư viện**: `@tanstack/react-virtual`.
- **Ngôn ngữ**: React 19, Tailwind v4.
