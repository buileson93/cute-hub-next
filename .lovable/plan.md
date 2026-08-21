# Kế hoạch Tái cấu trúc Bảng & Scrollbar (Phase U9)

Mục tiêu: Thống nhất kiến trúc render bảng, giải quyết triệt để lỗi mất border khi sticky header, và tối ưu hóa thanh cuộn ngang (4px, tinh tế) để fit với màn hình hiển thị.

## 1. DataTableCore - Nền tảng Bảng Mới (Đã triển khai)
- [x] Sử dụng `border-separate` và `border-spacing-0` thay vì `border-collapse` để giữ nguyên border khi dùng `sticky header`.
- [x] Cơ chế `fitViewport`: Tự động tính toán `maxHeight` để thanh cuộn ngang luôn nằm trong tầm mắt người dùng mà không cần kéo xuống cuối trang.
- [x] Phân tách rõ ràng z-index: Header (40), Sticky Column (50) để tránh chồng lấn.
- [x] Scrollbar 4px: Tinh tế, mỏng, tự động ẩn hiện theo phong cách Apple.

## 2. Đồng bộ hóa CSS & Token (Đang thực hiện)
- [x] Cập nhật `@utility mirats-scroll` trong `src/styles.css`.
- [x] Chuẩn hóa `.mirats-table-cell-base` và `.mirats-table-header-base` trong `src/styles.css`.
- [ ] Xóa bỏ các style `table th/td` global còn sót lại gây xung đột border.

## 3. Di chuyển Pilot (U9.3)
- [x] **Thư viện tài liệu** (`/tai-lieu`): Chuyển sang `DataTableCore`.
- [ ] **Danh sách thiết bị** (`/thiet-bi/danh-sach`): Hoàn thiện pilot thứ 2 với đầy đủ dữ liệu từ `useDbTaxonomy`.

## 4. Kiểm toán & Mở rộng (U9.4)
- [ ] Rà soát `StandardTable.tsx` hiện tại để chuyển đổi các bảng còn lại sang `DataTableCore` mà không làm mất logic nghiệp vụ (RLS, Actions).
- [ ] Đảm bảo tính tương thích Mobile: `DataTableCore` sẽ tự động chuyển sang chế độ `overflow-x-auto` mượt mà.

## Chi tiết kỹ thuật
- **Z-Index Map:**
  - `Header`: 40 (sticky)
  - `Sticky Columns`: 50
  - `Action Column`: 50 (sticky right)
- **Viewport Fitting:** `window.innerHeight - rect.top - margin` (thanh cuộn luôn ở đáy màn hình).
- **Border Stability:** Ép border vào từng ô `th/td` thay vì dùng collapse để tránh bị che bởi header sticky.
