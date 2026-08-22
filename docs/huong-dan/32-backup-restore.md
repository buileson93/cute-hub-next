# 32. Backup & Restore ZIP

Đường dẫn: `/admin/backup`.

## Backup tự động

- Chạy hàng ngày (pg_cron — xem `docs/pg-cron-setup.md`).
- Lưu snapshot dạng ZIP gồm: dữ liệu JSON các bảng chính + ảnh storage.

## Backup thủ công

1. Vào `/admin/backup`.
2. Bấm **Tạo backup ngay**.
3. Chờ progress → file `.zip` xuất hiện trong danh sách.
4. Bấm **Tải xuống** để lưu về máy.

## Restore

1. Bấm **Restore từ file**.
2. Chọn file `.zip`.
3. Hệ thống hiển thị **preview**:
   - Số bảng, số bản ghi từng bảng.
   - Cảnh báo bản ghi xung đột.
4. Chọn chiến lược: **Overwrite / Merge / Skip conflicts**.
5. Bấm **Xác nhận Restore** — quá trình chạy trong background.

## Lưu ý

- Restore ghi audit log toàn bộ hành động.
- Không dùng để migrate schema — chỉ dữ liệu.
