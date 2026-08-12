# Plan - Khôi phục hiển thị và điều hướng MindMap (Sơ đồ hệ thống)

Người dùng phản hồi không tìm thấy MindMap hoặc MindMap bị ẩn. Kế hoạch này tập trung vào việc đảm bảo MindMap luôn có thể truy cập được thông qua nhiều lối tắt (tab, sidebar, search) và khắc phục lỗi hiển thị 0px nếu có.

## Tình trạng hiện tại
- MindMap nằm ở tab "Sơ đồ" của trang `/he-thong/cay`.
- Trang `/he-thong/thanh-phan` (Bảng) có nút chuyển sang MindMap nhưng đang dùng tham số `display` thay vì `view`.
- Sidebar mục "Sơ đồ hệ thống" đang trỏ tới `/so-do` (một trang khác, có thể trống hoặc cũ) thay vì dẫn thẳng tới MindMap của hệ thống tài sản.

## Các bước thực hiện

### 1. Đồng bộ hóa tham số điều hướng
- Cập nhật `src/routes/_app.he-thong.thanh-phan.tsx`: Đổi `search: { display: v }` thành `search: { view: v }` để khớp với `validateSearch` và logic sync của trang Cây.

### 2. Cập nhật Sidebar để dẫn thẳng tới MindMap
- Cập nhật `src/lib/mirats/nav-contract.ts`: Đổi link của mục "Sơ đồ hệ thống" từ `/so-do` thành `/he-thong/cay?view=mindmap`. Điều này giúp người dùng tìm thấy MindMap ngay từ menu chính.

### 3. Đảm bảo hiển thị MindMap không bị lỗi chiều cao
- Kiểm tra `src/routes/_app.he-thong.cay.tsx`: Đảm bảo container chứa `CayMindMap` có `min-h-[600px]` hoặc `flex-1` và container cha không bị bó hẹp chiều cao, giúp React Flow luôn hiển thị được.

### 4. Tự động chuyển tab khi tìm kiếm trúng Node
- Cập nhật logic trong `src/routes/_app.he-thong.cay.tsx`: Nếu người dùng đang ở tab khác (như Cây) mà tìm kiếm một node và bấm vào, nếu MindMap đang được mở ở một context nào đó, hãy đảm bảo người dùng có thể chuyển sang xem node đó trên sơ đồ. (Hiện tại logic focus node trong `CayMindMap` đã khá ổn, chỉ cần đảm bảo tab được active).

## Kiểm tra
- Bấm vào "Sơ đồ hệ thống" trên Sidebar -> phải ra đúng MindMap.
- Ở trang "Bảng thành phần", bấm tab "Sơ đồ" -> phải nhảy sang trang MindMap.
- Kiểm tra trên mobile (mặc dù MindMap bị ẩn trên mobile theo contract, nhưng tab vẫn nên hoạt động nếu user cố ý truy cập).

