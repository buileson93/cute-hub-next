# Kế hoạch Khắc phục Lỗi UI: Nút bấm và Thành phần Header (Phase U7.3)

Người dùng báo cáo các lỗi UI dai dẳng về việc nút bấm bị "cụt" nội dung, icon kính lúp trên TopBar bị mất, và các nút trong Dashboard bị chồng lấn. Phân tích cho thấy nguyên nhân gốc rễ nằm ở sự thiếu đồng nhất giữa các component tùy chỉnh và các thẻ HTML thô, cùng với các ràng buộc kích thước quá chặt chẽ trong `ui-density.ts`.

## Mục tiêu
1. **Hiển thị Icon Kính lúp**: Đảm bảo icon trong PowerSearch trên TopBar hiển thị rõ ràng, không bị đè bởi padding hoặc absolute positioning.
2. **Khắc phục chồng lấn Dashboard**: Sửa đổi cấu trúc flexbox của toolbar Dashboard để các nút không đè lên nhau khi ở chế độ compact.
3. **Đồng nhất nút Header**: Chuyển nút PowerSearch sang sử dụng chung mô hình với `NotificationBell` và `QrScanButton` để đảm bảo độ tin cậy.
4. **Chuẩn hóa kích thước nút**: Cập nhật `ui-density.ts` và `Button.tsx` để đảm bảo text không bị cắt ngắn (ellipsis) quá sớm.

## Chi tiết kỹ thuật

### 1. Cấu hình Mật độ (Density Configuration)
- **Tệp**: `src/lib/mirats/ui/ui-density.ts`
- **Thay đổi**: Tăng `CONTROL_H` cho desktop compact từ `min-h-[2rem]` lên `min-h-[2.25rem]` (36px) để chứa đủ text 12px mà không bị clipping.

### 2. Thành phần Nút (Button Component)
- **Tệp**: `src/components/ui/button.tsx`
- **Thay đổi**: 
  - Cập nhật `size` variants để sử dụng các token `min-h` mới.
  - Sửa `renderContent` để icon và text có khoảng cách ổn định bằng `gap-2`.
  - Loại bỏ `absolute` loading spinner nếu nó gây lệch layout, chuyển sang dùng cấu trúc flex ổn định hơn.

### 3. Header & TopBar
- **Tệp**: `src/components/mirats/app-shell/TopBar.tsx`
- **Thay đổi**: 
  - Refactor nút PowerSearch: Sử dụng `flex` thay vì định vị tuyệt đối cho icon.
  - Đảm bảo icon `Search` có `flex-shrink-0`.
  - Sử dụng mã màu MIRATS Blue `#0074e2` trực tiếp để tránh các vấn đề về độ tương phản.

### 4. Dashboard Toolbar
- **Tệp**: `src/routes/_app.index.tsx`
- **Thay đổi**: 
  - Cập nhật container chứa các nút "Cá nhân hóa", "Khôi phục" sử dụng `flex-nowrap` hoặc `gap` lớn hơn.
  - Loại bỏ các class Tailwind gây xung đột như `hidden md:flex flex`.

## Các bước thực hiện
1. Cập nhật `ui-density.ts` để nới lỏng các ràng buộc kích thước.
2. Sửa `button.tsx` để ổn định việc render text/icon.
3. Cập nhật `TopBar.tsx` để khôi phục hiển thị kính lúp.
4. Điều chỉnh `_app.index.tsx` để xử lý chồng lấn toolbar.
5. Kiểm tra bằng script Playwright để xác nhận các rect (kích thước thực tế) và tính khả dụng của icon.
