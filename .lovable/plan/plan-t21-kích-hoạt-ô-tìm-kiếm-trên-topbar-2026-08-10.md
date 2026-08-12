# Plan - T21: Kích hoạt ô tìm kiếm trên TopBar

Khôi phục chức năng của ô tìm kiếm trên thanh trên cùng bằng cách kết nối nó với `CommandPalette`.

## 1. Cập nhật TopBar (TopBar.tsx)
- Thêm logic phát hiện hệ điều hành (Windows/Mac) để hiển thị đúng phím tắt gợi ý (⌘K hoặc Ctrl K).
- Chuyển đổi `<Input>` thành một "nút giả" bằng cách:
    - Thêm `readOnly` (đã có nhưng cần đảm bảo giữ lại).
    - Thêm `cursor-pointer`.
    - Thêm sự kiện `onClick` và `onFocus` để bắn CustomEvent `mirats:open-command-palette`.
    - Cập nhật huy hiệu phím tắt để hiển thị động dựa trên hệ điều hành.
    - Thêm `aria-label="Mở bảng lệnh tìm kiếm"`.

## 2. Kiểm thử và Xác minh
- Chạy `npx tsc --noEmit` để kiểm tra kiểu dữ liệu.
- Kiểm tra thủ công:
    - Bấm vào ô tìm kiếm -> Bảng lệnh hiện ra.
    - Tab vào ô tìm kiếm -> Bảng lệnh hiện ra.
    - Hiển thị phím tắt đúng trên Mac và Windows.
    - Không thể gõ trực tiếp vào ô.

## 3. Rà soát CommandPaletteButton
- Sau khi hoàn thành, tôi sẽ báo cáo về tình trạng `CommandPaletteButton.tsx` hiện không được sử dụng và đề xuất phương án xử lý (tích hợp cho mobile hoặc xóa).

---
*Lưu ý: Chỉ bắn sự kiện hiện có, không can thiệp vào logic của CommandPalette.*
