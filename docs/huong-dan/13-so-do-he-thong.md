# 13. Sơ đồ hệ thống (FigJam)

Đường dẫn: `/so-do` (danh sách sơ đồ) → mở 1 sơ đồ tại `/so-do/{id}`.

## Tabs trong sơ đồ

- **Sơ đồ**: canvas FigJam-style.
- **Kết nối**: quản lý các đấu nối (đã gộp từ menu Topology cũ).

## Thao tác canvas

1. **Thêm khối**:
   - Bấm **+ Khối** → chọn từ thư viện hình (PC, Switch, UHF, VHF, UPS…).
   - Hoặc **Upload** ảnh riêng (SVG/PNG).
2. **Gán thiết bị vào khối**:
   - Bấm khối → drawer bên phải → chọn thiết bị `TB_XXXXXXXX` từ CSDL.
   - Khối chỉ nhận thiết bị có sẵn trong CSDL Tài sản.
3. **Vẽ đường nối**:
   - Hover khối → xuất hiện điểm nối → kéo sang khối khác.
   - Đặt nhãn cho đường (loại cáp, port…).
4. **Nhóm**: chọn nhiều khối → `Ctrl+G`.
5. **Zoom/pan** như FigJam (space + kéo, cuộn).

## Lưu & Version

- **Ctrl+S** hoặc bấm **Lưu**.
- Mỗi lần lưu tạo 1 revision — xem tab **Lịch sử** để rollback.

## Xuất sơ đồ

- **Xuất PNG / SVG / PDF** từ menu `⋯`.
