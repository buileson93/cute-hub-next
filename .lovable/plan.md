# Kế hoạch khắc phục lỗi cuộn và tối ưu hóa Table/Dashboard (Phase 11J)

Người dùng yêu cầu cập nhật Roadmap và giải quyết 2 vấn đề kỹ thuật:
1. Xác nhận cơ chế cuộn vô tận (Infinite Scroll) hoạt động tự động mà không cần bấm nút.
2. Sửa lỗi trang Dashboard Overview (`/tong-quan`) không cuộn được nội dung, đảm bảo thanh TopBar và Sidebar cố định trong khi nội dung cuộn.

## 1. Cập nhật Roadmap (Visual Text Edits)
Cập nhật nội dung tooltip tại `TopBar.tsx` và `aria-label` tại `TzClock.tsx` với văn bản tiếng Việt mới:
> "kiểm tra đã được cuộn vô tận khi cuộn tới cuối trang chưa và ko cần bấm vào nút kiểm tra dữ liệu , thêm vào đó dashboard overview có cuộn đuộc thêm thông tin chưa, chỉ cuộn nội dung ko cuộn thanh bar vả cả trang web,"

## 2. Khắc phục lỗi cuộn tại Dashboard Overview
**Vấn đề:** Trang `/tong-quan` đang sử dụng `PageBody` (có `overflow-hidden`) nhưng nội dung bên trong (`DashboardGrid`) có thể vượt quá chiều cao màn hình mà không có cơ chế cuộn cục bộ đúng cách, dẫn đến việc nội dung bị khuất.
**Giải pháp:**
- Cập nhật `src/routes/_app.tong-quan.tsx`: Đảm bảo container chứa `DashboardGrid` có `overflow-y-auto` và chiếm hết không gian còn lại.
- Kiểm tra `PageBody.tsx`: Xây dựng theo kiến trúc "One Scroll Owner". `PageBody` mặc định là `overflow-hidden` để các component con (như `StandardTable`) tự quản lý vùng cuộn của chúng. Tuy nhiên, đối với Dashboard, chúng ta cần vùng cuộn bao quanh toàn bộ grid.

## 3. Tăng cường Infinite Scroll (StandardTable)
**Vấn đề:** Người dùng phản hồi "nút tải thêm vẫn còn chưa tự động". Mặc dù Phase 11I đã thêm trigger, có thể threshold hoặc điều kiện chặn (isFetching) đang quá nhạy hoặc bị kẹt.
**Giải pháp:**
- Điều chỉnh `StandardTable.tsx`:
    - Giảm threshold trigger tự động (từ 100px lên 250px để tải sớm hơn).
    - Thêm logs debug (chế độ dev) để theo dõi sự kiện cuộn chạm đáy.
    - Đảm bảo `infiniteScroll.fetchNextPage` được gọi chính xác khi `hasNextPage` là true.

## Các tệp sẽ thay đổi:
- `src/components/mirats/app-shell/TopBar.tsx`: Cập nhật văn bản Roadmap.
- `src/components/mirats/TzClock.tsx`: Cập nhật aria-label Roadmap.
- `src/routes/_app.tong-quan.tsx`: Sửa layout cuộn cho Dashboard.
- `src/components/mirats/StandardTable.tsx`: Tối ưu threshold tự động tải.

## Kế hoạch E2E:
- Chạy lại `tests/table-integrity.test.py` để xác nhận Infinite Scroll không cần nút bấm.
- Thêm test case kiểm tra scroll container của trang Dashboard.
