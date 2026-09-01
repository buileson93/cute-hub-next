# supbase/dump

Nơi lưu gói sao lưu tạo từ **Quản trị → Sao lưu → Sao lưu toàn diện**.

Trình duyệt không ghi trực tiếp vào repository, nên gói được tải về máy dưới dạng
`supbase-dump-YYYYMMDD-HHmmss.zip` (hoặc ghi vào thư mục người dùng chọn). Muốn lưu cùng
mã nguồn, giải nén và chép nội dung vào chính thư mục này.

Mọi tệp dump thực tế đã được `.gitignore` bỏ qua để tránh commit dữ liệu thật.
Xem `docs/backup-supabase.md` để biết chi tiết cấu trúc và cách phục hồi.
