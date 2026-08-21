# Kế hoạch Khôi phục và Bảo vệ Liêm chính UI - Giai đoạn U7 (Audit Tổng lực & Fix triệt để)

Người dùng báo cáo rằng dù đã prompt nhiều lần nhưng các lỗi chồng lấn UI (overlaps) và kích thước không chuẩn vẫn chưa được khắc phục triệt để. Kế hoạch này tập trung vào việc rà soát toàn diện và áp dụng các giải pháp CSS/Component bền vững để giải quyết tận gốc.

## 1. Rà soát và Khắc phục Lỗi Chồng lấn (Overlap Audit)

*   **TopBar Search:** Khắc phục lỗi text placeholder chồng lên icon hoặc shortcut Cmd+K.
    *   Sử dụng `padding-left: 2.5rem` (pl-10) cho container button để dành chỗ cho icon `Search` tuyệt đối.
    *   Đảm bảo icon `Search` có `z-index` cao hơn và nằm ở vị trí cố định (`left-3`).
    *   Shortcut Cmd+K (`CommandIcon`) phải được đặt tuyệt đối (`right-3`) và có nền mờ (`backdrop-blur`) để không bị chữ đè lên.
*   **Toolbar & Bulk Actions:** Rà soát `BulkActionBar.tsx` và `StandardTable.tsx` toolbar.
    *   Đảm bảo các nút icon-only có khoảng cách (gap) tối thiểu 8px.
    *   Sử dụng `flex-wrap` hoặc `overflow-x-auto` cho các toolbar chứa nhiều nút để tránh tràn/chồng lên nhau trên màn hình nhỏ.

## 2. Chuẩn hoá Nền tảng UI (Foundation Parity)

*   **Switch Component:** Sửa lỗi thumb không căn giữa.
    *   Cập nhật `switch.tsx` và `astryx-component-skins.css` để thumb sử dụng `top: 50%` và `translate-y-[-50%]` tuyệt đối.
*   **Input & Command Palette:**
    *   Đồng bộ font size `13px` cho tất cả Input (`input.tsx`) và CommandInput (`command.tsx`).
    *   Sửa lỗi padding của `CommandInput` để icon Search không đè lên text nhập vào.
*   **Button Hierarchy:**
    *   Đảm bảo các trạng thái `loading` không làm thay đổi kích thước nút (dẫn đến xê dịch các phần tử lân cận).
    *   Sử dụng loader tuyệt đối hoặc giữ nguyên layout width khi loading.

## 3. Chặn lỗi Tràn ngang và Bể bố cục (Layout Integrity)

*   **Page Containers:** Áp dụng `max-w-full overflow-hidden` cho `PageFrame` và `PageBody` để chặn scroll ngang ngoài ý muốn.
*   **StandardTable:** Đảm bảo container bảng có `overflow-x-auto` và `min-w-0` trên các flex children.

## 4. Xác minh Tự động (Integrity Verification)

*   Tạo script `scripts/verify-ui-integrity.py` sử dụng Playwright để:
    *   Phát hiện các bounding box giao nhau (intersecting bounding boxes) của các phần tử anh em (nút, icon).
    *   Kiểm tra lỗi tràn ngang (horizontal scroll) ở các độ phân giải khác nhau (Desktop & Mobile).
    *   Chụp ảnh màn hình so sánh (visual regression) cho các vùng nhạy cảm: TopBar, Login form, Table Toolbar.

## Chi tiết kỹ thuật (dành cho AI)
- `TopBar.tsx`: Cấu trúc lại button Search, tách biệt layer Icon, Placeholder (truncate), và Shortcut.
- `astryx-component-skins.css`: Refactor `.astryx-switch` và `.astryx-switch-thumb` để dùng absolute centering.
- `input.tsx`: Force `text-[13px]` và update placeholder opacity.
- `button.tsx`: Cập nhật `loading` state để dùng `absolute` loader hoặc `visibility: hidden` cho text gốc để giữ layout ổn định.
