# Cải thiện cơ chế Hover Sidebar (T17)

Người dùng phàn nàn rằng tính năng hover không hoạt động như mong đợi và muốn sidebar chuyển nội dung (sub-menu) tương ứng khi hover qua các icon trên thanh Rail.

## Vấn đề hiện tại

1.  **Thiếu trigger hover trên Rail:** Hiện tại chỉ có Sub-sidebar mới có listener `onPointerEnter`, nhưng vì nó có `w-0` khi thu gọn nên không thể hover vào được.
2.  **Nội dung cố định:** Sub-sidebar luôn hiển thị menu của workspace hiện tại (theo đường dẫn), không thay đổi khi hover qua các icon khác trên Rail.
3.  **Trải nghiệm hover chưa mượt:** Di chuyển giữa Rail và Sub-sidebar có thể gây ra hiện tượng giật nếu không được xử lý chung một container.

## Giải pháp: Hover-to-Preview & Expand

1.  **Sidebar.tsx:**
    - Thêm prop `workspaceId?: string`.
    - Lọc `navGroups()` để chỉ hiển thị các mục thuộc `workspaceId` nếu prop này được truyền vào. Điều này cho phép "preview" menu của workspace khác mà không cần chuyển trang.
2.  **AppShell.tsx:**
    - Thêm state `hoveredWsId` để theo dõi workspace đang được hover.
    - Bọc cả **Rail** và **Sub-sidebar** vào một container `div` chung để quản lý state `isHovered` ổn định.
    - Khi di chuột vào một nút trên Rail, cập nhật `hoveredWsId` để Sub-sidebar hiển thị nội dung tương ứng.
    - Truyền `hoveredWsId || activeWs.id` xuống `Sidebar` component.
    - Đảm bảo khi di chuột ra khỏi vùng sidebar, `isHovered` và `hoveredWsId` đều được reset.

## Các bước thực hiện

1.  Cập nhật `Sidebar.tsx` để hỗ trợ lọc theo `workspaceId`. (Đã thực hiện một phần)
2.  Cập nhật `AppShell.tsx`:
    - Thêm state `hoveredWsId`.
    - Cấu trúc lại JSX để bọc 2 `aside` vào container điều khiển hover.
    - Thêm các trigger `onPointerEnter` vào các nút bấm trên thanh Rail.
3.  Kiểm tra lại hiệu ứng transition và đảm bảo không chồng lấn icon.
4.  Chạy test suite T17 để xác nhận logic.
