# Kế hoạch Khôi phục Giao diện Đăng nhập (Auth Page)

Khôi phục giao diện trang đăng nhập khớp 100% với thiết kế trong hình ảnh tải lên, giải quyết triệt để lỗi nút "Đăng nhập" bị thu nhỏ và chuẩn hoá bố cục hai cột.

## Thay đổi Chính

### 1. Sửa lỗi Nút Đăng nhập (Primary Button)
- Loại bỏ các class Tailwind gây xung đột kích thước (`h-12`, `w-full`) khi kết hợp với `inline-flex` của Astryx.
- Sử dụng `variant="default"` và `size="lg"` chuẩn của hệ thống nhưng ghi đè `md:h-12` để đảm bảo chiều cao 48px trên desktop.
- Căn giữa nội dung nút và đảm bảo icon `LogIn` hiển thị đúng tỉ lệ.

### 2. Chuẩn hoá Bố cục & Hình ảnh (AtcTowerScene)
- Cập nhật `src/routes/auth.tsx` để sử dụng lưới `grid-cols-1 lg:grid-cols-2` cân bằng.
- Bo tròn góc container chính (`rounded-[32px]`) và thêm đổ bóng mềm mại theo phong cách Apple.
- Đảm bảo hình ảnh `AtcTowerScene` ở bên phải chiếm trọn không gian và hiển thị đúng các lớp radar/telemetry.

### 3. Tinh chỉnh Form & Logo
- Logo VATM MIRATS: Căn chỉnh kích thước và lề để cân đối với form.
- Tabs (Đăng nhập/Đăng ký): Chuyển sang dạng pill-tab màu xám sáng với hiệu ứng trượt xanh MIRATS.
- Input Fields: Tăng độ bo góc (`rounded-xl`) và tinh chỉnh màu border khi focus.
- Password Link: Di chuyển "Quên mật khẩu?" lên ngang hàng với nhãn (label) Mật khẩu.

## Chi tiết Kỹ thuật
- **File ảnh hưởng**: `src/routes/auth.tsx`, `src/components/mirats/AtcTowerScene.tsx`.
- **CSS**: Sử dụng biến số mật độ `UI_DENSITY` để đảm bảo đích chạm (touch target) trên mobile luôn đạt 44px.
- **Hiệu ứng**: Giữ nguyên các hiệu ứng `motion/react` cho các thành phần form để tạo cảm giác hiện đại.

## Xác minh
- Chạy Playwright audit để kiểm tra `scrollWidth` không vượt quá `clientWidth` ở 390px (mobile) và 1280px (desktop).
- Đo đạc lại kích thước nút để đảm bảo không còn tình trạng 34x18px.
