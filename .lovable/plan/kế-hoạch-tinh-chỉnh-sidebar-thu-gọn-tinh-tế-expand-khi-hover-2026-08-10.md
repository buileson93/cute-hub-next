# Kế hoạch Tinh chỉnh Sidebar: Thu gọn Tinh tế & Expand khi Hover (T17)

Người dùng yêu cầu thay đổi cơ chế thu gọn sidebar: Thay vì nút toggle "thô", sidebar sẽ tự động mở rộng (expand) khi người dùng di chuột vào (hover) và thu lại khi rời đi, giống như cơ chế cũ.

## Các bước thực hiện:

### 1. Cập nhật Logic Hover & Collapse trong `AppShell.tsx`
- Loại bỏ nút toggle "thô" ở chân sidebar.
- Thêm state `isHovered` để theo dõi trạng thái di chuột qua thanh `<aside>` (Sub-sidebar).
- Sử dụng `onMouseEnter` và `onMouseLeave` trên thẻ `<aside>` để điều khiển `isHovered`.
- Cập nhật logic hiển thị: Sidebar sẽ mở rộng khi `!isCollapsed || isHovered`. Tuy nhiên, để đúng ý "cách cũ", `isCollapsed` sẽ là trạng thái mặc định (persistent), và hover sẽ là trạng thái tạm thời (overlay/expand).
- **Lưu ý quan trọng**: Khi hover expand, sidebar không nên đẩy nội dung trang (main content) sang phải (tránh giật lag giao diện). Ta sẽ cân nhắc dùng `absolute` hoặc `z-index` cho phần expand nếu cần, hoặc giữ nguyên flex nhưng làm mượt transition.

### 2. Tinh chỉnh CSS & Transition
- Sử dụng `group` và `group-hover` nếu có thể, hoặc dùng state React để kiểm soát class width.
- Đảm bảo transition `duration-300` hoặc `duration-200` để cảm giác "tinh tế".
- Ẩn/Hiện nội dung (text) mượt mà bằng `opacity` và `delay`.

### 3. Cập nhật `Sidebar.tsx`
- Đảm bảo `Sidebar` nhận đúng prop `collapsed` dựa trên cả 2 state (`isCollapsed` và `isHovered`).
- Nếu đang hover, `collapsed` truyền xuống sẽ là `false` để hiện đầy đủ nhãn.

### 4. Xác minh
- Kiểm tra trải nghiệm hover trên desktop.
- Đảm bảo không ảnh hưởng đến Mobile (vốn dùng Sheet/Drawer).

## Xong khi:
- Sidebar mặc định thu gọn (dải icon).
- Di chuột vào sidebar thì nó tự bung ra hiện đầy đủ chữ.
- Rời chuột ra thì nó tự co lại.
- Nút toggle cũ bị loại bỏ để giao diện tinh tế hơn.
