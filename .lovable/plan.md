# Kế hoạch: Bổ sung tài khoản nhân viên và xử lý lỗi đăng nhập

Người dùng yêu cầu tạo thêm 2 tài khoản mới cho nhân viên `vuhongson` và `trannguyenbaoanh`, đồng thời kiểm tra tại sao các tài khoản trước đó vẫn gặp lỗi đăng nhập (do bản preview cũ hay lỗi hệ thống).

## Thông tin chẩn đoán hiện tại
- Đã kiểm tra cơ sở dữ liệu:
    - `tranquangvinh@vatm.vn`: Đã tồn tại, role `phong_kt`, `active: true`.
    - `nguyenluonggiam@vatm.vn`: Đã tồn tại, role `phong_kt`, `active: true`.
    - `vuhongson@vatm.vn`: **Chưa tồn tại**.
    - `trannguyenbaoanh@vatm.vn`: **Chưa tồn tại**.
- Lỗi đăng nhập thường do đồng bộ giữa `auth.users` và `public.profiles` hoặc chính sách RLS. Bản preview có thể bị trễ HMR hoặc cache trình duyệt nếu thay đổi vừa được áp dụng.

## Các bước thực hiện

### 1. Tạo tài khoản mới (SQL Migration)
Tạo 2 tài khoản mới với mật khẩu mặc định `Vatm@2026` và gán vai trò `phong_kt`.
- Tài khoản: `vuhongson@vatm.vn` (Vũ Hồng Sơn)
- Tài khoản: `trannguyenbaoanh@vatm.vn` (Trần Nguyễn Bảo Anh)

### 2. Củng cố quy trình đồng bộ (Backend)
- Đảm bảo trigger `handle_new_user` hoạt động ổn định.
- Chạy lại script đồng bộ cưỡng bức để đảm bảo tất cả `auth.users` đều có `public.profiles` và `user_roles`.

### 3. Kiểm tra tính nhất quán của bản Preview
- Thực hiện kiểm tra bằng Playwright trên môi trường preview để xác nhận luồng đăng nhập thực tế với tài khoản vừa tạo.
- Xóa cache server nếu cần thiết (bằng cách kích hoạt bản build mới).

## Chi tiết kỹ thuật
- Sử dụng `auth.admin.createUser` qua SQL để tránh các vấn đề về giao diện admin khi đang debug.
- Mật khẩu: `Vatm@2026`.
- Vai trò: `phong_kt` (Phòng kỹ thuật).
- Đơn vị mặc định: `null` (hoặc sẽ gán sau qua giao diện Admin).
