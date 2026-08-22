# Kế hoạch Phục hồi Liêm chính UI MIRATS (Phase U7.1)

Khắc phục triệt để tình trạng các phần tử giao diện bị chồng lấn (overlap) và bể layout do xung đột giữa Tailwind v4 và hệ thống skin Astryx.

## Các vấn đề cần giải quyết

1.  **TopBar Search Overlap**: Nút tìm kiếm bị đè icon và phím tắt Cmd+K lên text placeholder.
2.  **Button Overlap**: Các nút bấm trong toolbar bị chồng lấn khi ở trạng thái loading hoặc co giãn màn hình.
3.  **PageHeader & BulkActions**: Tiêu đề và thanh hành động hàng loạt bị tràn hoặc đè lên nội dung khác.
4.  **UI Integrity Guard**: Thiếu cơ chế tự động phát hiện chồng lấn các phần tử (Intersection detection).

## Chi tiết kỹ thuật

### 1. Sửa lỗi TopBar Search & PowerSearch

- **File**: `src/components/mirats/app-shell/TopBar.tsx`
- **Thay đổi**: Sử dụng `grid` hoặc `flex` với các vùng cố định (`fixed-width slot`) thay vì `absolute` toàn bộ cho Icon/Shortcut. Đảm bảo `padding-left` và `padding-right` của text luôn đủ lớn để không bị icon đè lên.
- **PowerSearch**: Cập nhật `CommandInput` để có font-size 13px đồng nhất và không bị co lại trên mobile.

### 2. Chuẩn hoá Toolbar & BulkActionBar

- **File**: `src/components/mirats/BulkActionBar.tsx`, `src/components/mirats/StandardTable.tsx`
- **Thay đổi**:
  - Áp dụng `flex-wrap` cho các nhóm nút hành động.
  - Sử dụng `gap` từ `UI_DENSITY` để đảm bảo khoảng cách an toàn.
  - Cố định chiều rộng tối thiểu cho các nút icon-only để tránh bị co mất hình.

### 3. Củng cố Button Hierarchy & Loading State

- **File**: `src/components/ui/button.tsx`
- **Thay đổi**: Đảm bảo `renderContent` giữ nguyên kích thước chiếm chỗ (layout stability) khi `loading=true` bằng cách sử dụng `visibility: hidden` cho text thay vì `opacity-0` nếu cần, và đặt `absolute loader` chính xác vào tâm.

### 4. Xây dựng Công cụ Kiểm tra Tự động (Integrity Guard)

- **File**: `scripts/verify-ui-overlap.py` (sử dụng Playwright)
- **Hành động**: Quét trang `/` và `/su-co` để tìm các phần tử có bounding box giao nhau (overlapped) mà không phải là overlay/dialog hợp lệ.
- **Mục tiêu**: Báo cáo lỗi nếu `Search Icon` và `Placeholder Text` giao nhau > 1px.

### 5. Tài liệu hướng dẫn (Docs)

- **File**: `docs/ui/u7-fix-steps.md`
- **Nội dung**: Quy trình 5 bước để debug và fix overlap bằng kỹ thuật `outline-1` và Playwright.

## Kiểm thử

- Sử dụng Playwright giả lập độ phân giải 1280px (Desktop) và 390px (Mobile).
- Tài khoản test: `buileson93@gmail.com` / `12345`.
- Kiểm tra tính trạng "CÁ NHÂN HÓA" và "THÊM MẪU" không bị đè viền.

## User-Facing Summary

Tôi sẽ thực hiện sửa lỗi chồng lấn giao diện trên thanh tìm kiếm và các nút bấm, đồng thời thiết lập công cụ tự động phát hiện lỗi UI để ngăn chặn tình trạng này tái diễn. Các bước sửa lỗi sẽ được ghi lại trong file `.md` như bạn yêu cầu.
