# 01. Đăng nhập & phiên làm việc

## Mục đích

Xác thực người dùng vào hệ thống MIRATS bằng email/mật khẩu.

## Các bước thực hiện

### A. Đăng nhập lần đầu

1. Mở trình duyệt, truy cập URL của hệ thống (ví dụ `https://cute-device-hub.lovable.app`).
2. Trang `/auth` sẽ hiện ra với 2 tab: **Đăng nhập** / **Đăng ký**.
3. Nhập **Email** và **Mật khẩu** đã được cấp.
4. Bấm **Đăng nhập**.
5. Hệ thống chuyển hướng về trang chủ `/` (Overview).

### B. Quên mật khẩu

1. Tại `/auth`, bấm liên kết **Quên mật khẩu**.
2. Nhập email → bấm **Gửi liên kết**.
3. Kiểm tra email, mở liên kết → nhập mật khẩu mới tại `/reset-password`.

### C. Tài khoản chờ duyệt

- Nếu tài khoản mới đăng ký, bạn sẽ được chuyển tới `/pending` cho tới khi admin kích hoạt.

### D. Đăng xuất

1. Bấm avatar góc phải Topbar.
2. Chọn **Đăng xuất**.

## Lưu ý

- Session được lưu trong trình duyệt (Supabase). Khi hết hạn, hệ thống tự chuyển về `/auth`.
- Nếu gặp banner "Mất kết nối mạng", đợi hệ thống tự ping lại; không cần refresh.

## Sự cố thường gặp

| Triệu chứng                         | Nguyên nhân                | Cách xử lý                             |
| ----------------------------------- | -------------------------- | -------------------------------------- |
| Đăng nhập bị đá về `/auth` liên tục | Token hết hạn              | Xóa localStorage → đăng nhập lại       |
| Không nhận email reset              | Sai domain / spam          | Liên hệ admin kiểm tra SMTP            |
| "Unsupported provider"              | Google OAuth chưa cấu hình | Admin bật provider trong Cloud → Users |
