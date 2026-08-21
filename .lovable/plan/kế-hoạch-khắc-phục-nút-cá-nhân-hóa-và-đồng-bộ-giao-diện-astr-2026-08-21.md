# Kế hoạch khắc phục nút "Cá nhân hóa" và đồng bộ giao diện Astryx (Phase U7.4)

Người dùng báo cáo rằng nút "Cá nhân hóa" (Personalization) cũng đang gặp lỗi chồng lấn tương tự như nút PowerSearch trước đó. Phân tích cho thấy nguyên nhân nằm ở việc sử dụng component `Button` với logic `renderContent` phức tạp, gây lỗi khi kết hợp với các class `astryx-control`.

## Nội dung thực hiện

### 1. Đơn giản hóa Component Button
- Tinh chỉnh `src/components/ui/button.tsx` để `renderContent` trả về cấu trúc phẳng hơn.
- Đảm bảo `Icon` và `Text` được quản lý bởi Flexbox trực tiếp của nút thay vì bọc qua nhiều lớp `span`.
- Cố định vị trí Spinner khi `loading={true}` để không làm thay đổi kích thước nút.

### 2. Cập nhật nút "Cá nhân hóa" trên các Dashboard
- Thay thế các nút "Cá nhân hóa" (hiện đang dùng `Button` với text viết hoa cứng) bằng cấu trúc đồng bộ với `TopBar`.
- Áp dụng trên:
    - `src/routes/_app.index.tsx` (Home Dashboard)
    - `src/routes/_app.tong-quan.tsx` (Overview Dashboard)
    - `src/routes/_app.su-co.index.tsx` (Incident Dashboard)
- Chuyển sang dùng `Icon` từ registry và đảm bảo khoảng cách `gap-2` chuẩn Astryx.

### 3. Đồng bộ hóa Header Action Buttons
- Rà soát `RealtimeStatusIndicator`, `CommandPaletteButton`, `QrScanButton`, `NotificationBell` trong `TopBar.tsx`.
- Đảm bảo tất cả dùng chung một cơ chế render icon (16x16px hoặc 18x18px) và hiệu ứng hover (`bg-[#0074e2]/10`).

## Kỹ thuật chi tiết
- Sử dụng `astryx-control` làm class cơ sở để nhận diện các nút tương tác hệ thống.
- Ép kích thước icon trong nút qua CSS nếu cần để tránh bị `lucide-react` ghi đè size không mong muốn trên mobile.
- Kiểm tra lại `z-index` của các tooltip để không đè lên menu dropdown.

## Tiêu chí hoàn thành
- Nút "Cá nhân hóa" hiển thị icon và text rõ ràng, không bị đè lên nhau.
- Trạng thái `isEditing` (Hoàn tất) hiển thị đúng màu thương hiệu MIRATS Blue.
- Không có lỗi layout khi thay đổi mật độ (Density: Compact/Comfortable).
