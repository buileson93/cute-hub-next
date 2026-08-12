# Plan - Khôi phục hiển thị MindMap trong hệ thống

Người dùng phản hồi không tìm thấy MindMap ở trang Hệ thống. Sau khi kiểm tra, MindMap (Sơ đồ) đã có trong code nhưng có thể đang gặp vấn đề về hiển thị hoặc luồng chuyển đổi tab.

## Tình trạng hiện tại
- Route `/he-thong/cay` đã có `CayMindMap` và tab "Sơ đồ".
- Route `/he-thong/thanh-phan` (Bảng) có tab "Sơ đồ" nhưng khi bấm vào nó điều hướng sang `/he-thong/cay` với tham số `display=mindmap`.
- `CayContext` quản lý `display` mode và đồng bộ với URL search param `view`.

## Các bước thực hiện

### 1. Kiểm tra và sửa lỗi hiển thị CayMindMap
- Đảm bảo `CayMindMap` có chiều cao cố định hoặc chiếm hết không gian container cha. Hiện tại `src/routes/_app.he-thong.cay.tsx` đang dùng `h-full w-full`, cần kiểm tra xem container cha có `flex-1` và `min-h-0` chưa.
- Kiểm tra `CayMindMap.tsx` để xem logic render React Flow có bị lỗi 0px height không.

### 2. Đồng bộ hóa Tab và Điều hướng
- Đảm bảo khi ở `/he-thong/thanh-phan` bấm tab "Sơ đồ", trang được chuyển sang `/he-thong/cay?view=mindmap` và hiển thị đúng mode mindmap.
- Kiểm tra `validateSearch` trong route `/he-thong/cay` để chắc chắn nó nhận tham số `view`.

### 3. Cải thiện UI Tab Hệ thống
- Kiểm tra xem tab "Sơ đồ" có bị ẩn trên mobile không (vì React Flow thường khó dùng trên mobile). Nếu có, hãy đảm bảo người dùng biết hoặc cung cấp fallback.

## Chi tiết kỹ thuật
- File sửa: `src/routes/_app.he-thong.cay.tsx`, `src/components/mirats/he-thong-cay/CayMindMap.tsx`.
- Sử dụng `ReactFlow` với container có kích thước xác định.
- Đảm bảo `display === 'mindmap'` kích hoạt đúng component.

## Kiểm tra
- Truy cập `/he-thong/thanh-phan`, bấm tab "Sơ đồ".
- Truy cập trực tiếp `/he-thong/cay?view=mindmap`.
- Kiểm tra trên các độ phân giải màn hình khác nhau.
