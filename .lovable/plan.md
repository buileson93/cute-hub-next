# Plan - Khôi phục kích thước nút Đăng nhập

Người dùng phản hồi nút "Đăng nhập" vẫn chưa đúng thiết kế (kích cỡ không khớp hình ảnh). Kiểm tra thực tế cho thấy nút đang có `display: block` dẫn đến mất khả năng căn giữa nội dung của Flexbox và kích thước bị bóp méo.

## Các thay đổi kỹ thuật

### 1. Sửa lỗi CSS hiển thị nút
- Trong `src/routes/auth.tsx`, loại bỏ `!flex` (vì nó đang bị ghi đè hoặc không ăn nhập với Astryx logic dẫn đến `display: block` ở runtime).
- Ép kiểu hiển thị `inline-flex` chuẩn của Astryx nhưng đảm bảo `width: 100%`.
- Kiểm tra lại các utility class `!h-14` (tương đương 56px) để đảm bảo nút có độ cao lớn như thiết kế.

### 2. Tinh chỉnh Layout Form
- Đảm bảo khoảng cách giữa các trường (Email, Mật khẩu) và nút Đăng nhập đạt độ thưa tối ưu (spacing-y-6 hoặc 8).
- Kiểm tra `border-radius` của nút (hiện là 16px - `rounded-2xl`), đảm bảo khớp hoàn toàn với thiết kế bo tròn mạnh.

### 3. Đồng bộ hóa Button Component (nếu cần)
- Kiểm tra `src/components/ui/button.tsx` để đảm bảo khi dùng `size="lg"` nó không bị giới hạn chiều cao bởi các breakpoint `md:h-10`. Trong trang Auth, chúng ta cần kích thước cố định lớn.

## Các bước thực hiện

1. Sửa `src/routes/auth.tsx`:
   - Thay đổi class của `Button` đăng nhập: loại bỏ các class gây xung đột `display`.
   - Sử dụng `flex items-center justify-center` một cách tường minh nếu `inline-flex` của component bị ghi đè.
2. Kiểm tra lại `AtcTowerScene.tsx` để đảm bảo phần hình ảnh bên phải không bị lệch khi form thay đổi kích thước.
3. Chạy Playwright kiểm tra bounding box của nút: mục tiêu đạt ~56px chiều cao và nội dung chữ "Đăng nhập" phải căn giữa tuyệt đối.

## User Review Required

> [!IMPORTANT]
> Nút Đăng nhập trong hình mẫu có độ cao lớn và bo góc mạnh. Tôi sẽ ép chiều cao 56px và bo góc 16px. Bạn có muốn tăng thêm kích thước font chữ của nút không? (Hiện tại là 16px).
