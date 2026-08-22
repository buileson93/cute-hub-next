# Kế hoạch Khôi phục & Chuẩn hoá UI MIRATS (Phase U7)

Mục tiêu: Sửa lỗi "bể" giao diện (UI breakage) phát sinh sau khi nâng cấp hệ thống thiết kế Astryx, tập trung vào các nút bấm bị sai kích thước, căn lề lệch và các thành phần nhập liệu không đồng nhất.

## Các vấn đề phát hiện

1. **TopBar Search Area**: Nút tìm kiếm PowerSearch bị chèn ép, icon và shortcut `Ctrl+K` có thể bị đè lớp hoặc sai padding (như hình ảnh người dùng cung cấp).
2. **Button Density Conflict**: Nút `default` của Astryx trong `button.tsx` đang dùng `inline-flex` nhưng có các thuộc tính `h-11 md:h-8` có thể bị ghi đè bởi Tailwind class cũ (`h-12`, `w-full`) gây mất cân đối.
3. **Switch Component**: Thumbnail của Switch bị lệch do sai logic căn giữa tuyệt đối trong CSS layer.
4. **Input Component**: Mật độ chữ (`text-[11px]`) trong `input.tsx` quá nhỏ so với tiêu chuẩn 12px-13px của MIRATS.
5. **Horizontal Overflow**: Một số bảng lớn (StandardTable) có thể gây tràn ngang trên màn hình nhỏ nếu không được giới hạn `max-w-full`.

## Các bước thực hiện

### 1. Chuẩn hoá Switch & Input (Nền tảng)

- Cập nhật `src/styles/astryx-component-skins.css` để đảm bảo `.astryx-switch-thumb` luôn được căn giữa dọc bằng `top-1/2 -translate-y-1/2`.
- Nâng kích thước font chữ mặc định của `Input` trong `src/components/ui/input.tsx` từ `text-[11px]` lên `text-[13px]` để đảm bảo tính dễ đọc.

### 2. Sửa lỗi TopBar Search (Visual Fix)

- Điều chỉnh `src/components/mirats/app-shell/TopBar.tsx`:
  - Đảm bảo `Search` icon và shortcut `Ctrl+K` dùng `absolute` với `z-index` phù hợp.
  - Sửa padding của text `Tìm tài sản...` (thay `pr-8` bằng `px-10`) để không bị đè lên icon/shortcut.

### 3. Đồng bộ hoá Nút bấm (Button Global Fix)

- Cập nhật `src/components/ui/button.tsx` để xử lý tốt hơn các thuộc tính `loading`.
- Rà soát `src/routes/auth.tsx` để đảm bảo nút Đăng nhập dùng class chuẩn của Astryx thay vì các class Tailwind ghi đè thô bạo.

### 4. Kiểm tra và Khắc phục Tràn ngang

- Áp dụng `overflow-x-auto` và `max-w-full` cho các container chứa `StandardTable` trong `src/routes/_app.su-co.index.tsx` và các trang G1 khác.

## Danh sách file sửa đổi

- `src/styles/astryx-component-skins.css`
- `src/components/ui/switch.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/button.tsx`
- `src/components/mirats/app-shell/TopBar.tsx`
- `src/routes/auth.tsx`
- `src/routes/_app.su-co.index.tsx`

## Kiểm tra hồi quy (Audit)

- Chạy `scripts/ui-audit.mjs` để xác nhận số lượng vi phạm UI giảm.
- Dùng Playwright quét lại các trang `/auth`, `/tong-quan`, `/su-co` ở độ phân giải Desktop và Mobile (390px).
