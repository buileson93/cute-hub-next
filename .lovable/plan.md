# Kế hoạch Tối ưu Hình học Bảng & Hiệu năng (Phase 10Z+)

Người dùng yêu cầu khắc phục triệt để lỗi cuộn bảng làm mất header/nút, thiếu thanh cuộn ngang trong tầm mắt, và tình trạng lag giật trên thiết bị yếu.

## 1. Sửa lỗi Hình học Bảng (Scroll Geometry)
- **Vấn đề**: Giao diện bị cuộn dọc cả trang làm ẩn các nút và tiêu đề cột. Thanh cuộn ngang khó tìm.
- **Giải pháp**: 
    - Củng cố cấu trúc `PageBody` với `overflow-hidden` và `flex-col`.
    - Đảm bảo `StandardTable` và `DataTableCore` nhận đúng `max-height` hoặc tự động chiếm trọn phần còn lại của màn hình thông qua `flex-1`.
    - Cố định tiêu đề cột (`TableHeader`) bằng `sticky top-0` với `z-index` cao hơn nội dung.
    - Đưa thanh cuộn ngang vào vùng nhìn thấy bằng cách ép kiểu `overflow-x: auto` trên container bảng và đảm bảo nó không bị đẩy ra ngoài bởi padding của trang.

## 2. Tối ưu Hiệu năng (Performance Optimization)
- **Vấn đề**: Lag giật, tốn phần cứng khi cuộn nhiều dữ liệu.
- **Giải pháp**:
    - **Adaptive Overscan**: Điều chỉnh số lượng hàng render trước dựa trên FPS thực tế (từ 4-15 hàng).
    - **GPU Hardware Acceleration**: Sử dụng `will-change: transform` và `translate3d` để trình duyệt xử lý render mượt hơn.
    - **Layout Isolation**: Áp dụng thuộc tính CSS `contain` (content, layout, size) cho từng hàng để giảm thiểu chi phí tính toán lại layout (reflow).
    - **Fixed Table Layout**: Ép trình duyệt sử dụng `table-layout: fixed` để tính toán chiều rộng cột nhanh hơn.
    - **Memoization**: Tinh chỉnh `OptimizedCell` để ngăn chặn re-render không cần thiết khi dữ liệu không đổi.

## 3. Đồng bộ Trạng thái & Text
- **Vấn đề**: Mất cột hiển thị khi đổi tab hoặc cuộn.
- **Giải pháp**:
    - Sử dụng `localStorage` để lưu cấu hình cột đồng bộ giữa các tab "Theo Tài sản" và "Theo Thành phần".
    - Cập nhật text chẩn đoán trong `src/routes/__root.tsx` theo yêu cầu verbatim của người dùng.

## Các tệp sẽ chỉnh sửa:
1. `src/routes/__root.tsx`: Cập nhật text chẩn đoán.
2. `src/components/mirats/DataTableCore.tsx`: Tối ưu CSS containment, scroll và GPU.
3. `src/components/mirats/StandardTable.tsx`: Tinh chỉnh logic ảo hóa và fixed header.
4. `src/styles.css`: Chuẩn hóa thanh cuộn `mirats-scroll` để dễ thấy hơn.
5. `src/routes/_app.he-thong.thanh-phan.tsx`: Kiểm tra layout wrapper.
