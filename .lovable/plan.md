# Phase 10J: UI Contract & Primitive Ownership

Khôi phục tính nhất quán của các component primitive, xác định quyền sở hữu style (Astryx vs Tailwind) và thực thi khả năng truy cập (A11y) mà không làm thay đổi ngôn ngữ thiết kế MIRATS.

## Các thay đổi chính

### 1. Primitive Hardening (Button & Icons)
- **Button.tsx**: Loại bỏ `w-full h-full` dư thừa trên wrapper nội dung gây lỗi layout trong các container nhỏ. Thay thế `span` wrapper cho loader bằng `div` để tránh vi phạm HTML semantic khi lồng các block elements.
- **Icon chuẩn hóa**: Cập nhật `src/styles.css` để ép kích thước icon Lucide mặc định là `1.125rem` (18px) thay vì dùng `transform: scale` gây mờ pixel trên màn hình mật độ thấp.

### 2. Scoped Styling (Table & CSS Ownership)
- **Table CSS**: Chuyển các global table selectors trong `src/styles.css` sang scoped selectors (`.mirats-data-table-core`, `.mirats-data-table-legacy`) để tránh ảnh hưởng đến các bảng của thư viện bên thứ ba (như React Flow) hoặc các thành phần shadcn mặc định.
- **DataTableCore**: Duy trì kiến trúc `block-flex` đã triển khai ở Phase 10I để đảm bảo hiệu năng ảo hóa (virtualization) và cuộn Apple-style mượt mà.

### 3. Accessibility (A11y) & Raw Control Migration
- **A11y Labels**: Bổ sung `aria-label` cho tất cả các điều khiển icon-only trong route `/danh-muc/thiet-bi` (Search, Filter Selects, v.v.).
- **Raw Button Migration**: Chuyển đổi các thẻ `<button>` thô trong `/danh-muc/model` sang component `Button` chuẩn của dự án để hưởng các tính năng active-scale, tooltip tự động và brand styling.
- **Table Inventory**: Xác định các route `/admin/ocr` và `/admin/kiem-tra-so-lieu` đang dùng thẻ `<table>` thô để áp dụng class `.mirats-data-table-legacy`, đảm bảo chúng không bị bể layout khi global CSS bị xóa bỏ.

### 4. Visual Regression Guard
- Cập nhật `TzClock.tsx` với nội dung **Visual Contract** để làm baseline cho các công cụ audit tự động.
- Kiểm tra tính tương thích trên 4 breakpoint (390/768/1024/1440px).

## Chi tiết kỹ thuật
- **Ownership**: Primitive components (shadcn/ui/*) sở hữu cấu trúc; Tailwind sở hữu layout/spacing; Astryx sở hữu tokens (màu sắc, bo góc, độ bóng).
- **Phân tách**: Không dùng `!important`. Mọi thay đổi visual phải thông qua thay đổi utility classes hoặc biến theme.
