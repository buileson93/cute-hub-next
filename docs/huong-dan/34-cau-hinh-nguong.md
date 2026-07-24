# 34. Cấu hình ngưỡng cảnh báo & chính sách

## Bảo dưỡng
`/admin/bao-tri-chinh-sach`:
- Chu kỳ bảo dưỡng mặc định theo Chủng loại.
- Ngưỡng cảnh báo trước hạn (ngày).
- Người nhận cảnh báo (user / group Telegram).

## Kiểm kê
- Chu kỳ theo Chủng loại — cấu hình trong danh mục Chủng loại.
- Ngưỡng ngày cảnh báo tại `Admin → Cấu hình`.

## Giấy phép & Kiểm định
- Ngưỡng tập trung tại `src/lib/mirats/thresholds.ts` (registry duy nhất).
- Admin sửa qua giao diện `Cài đặt hệ thống → Ngưỡng cảnh báo`:
  - Giấy phép: 90 / 60 / 30 ngày.
  - Kiểm định: 60 / 30 / 7 ngày.
  - Bảo hành: 60 / 30 ngày.

## Kênh thông báo
- **Trong app**: badge realtime.
- **Email**: bật/tắt theo user.
- **Telegram**: cấu hình bot token + chat_id ở `Admin → Secrets`.

## Product Tour
- Bật/tắt Product Tour toàn hệ thống: `Admin → Cấu hình → Onboarding`.

Mọi thay đổi cấu hình đều ghi vào Audit log.
