# 33. Data Review Console

Đường dẫn: `/admin/review`.

## Mục đích
Phát hiện & xử lý dữ liệu trùng lặp / mâu thuẫn theo Entity Resolution: khớp ID, Serial, Tên gần đúng.

## Các tab
- **Trùng Thiết bị** — cùng serial khác `TB_`.
- **Trùng Model** — tên gần giống, cùng NSX.
- **Trùng NSX/NCC**.
- **Model thiếu Chủng loại** — do tự tạo khi import.
- **Thiết bị mồ côi** — không thuộc đơn vị nào.

## Xử lý
1. Chọn 1 nhóm trùng.
2. Ứng viên "canonical" được đánh dấu (nhiều FK nhất thắng — quy tắc "FK link wins").
3. Bấm **Hợp nhất** → các bản ghi khác được merge, mọi FK trỏ sang canonical.
4. Audit log ghi lại toàn bộ.

## Flag để review sau
- Nếu chưa chắc → bấm **Đánh dấu review** — ẩn khỏi danh sách chính, xuất hiện ở tab **Đã flag**.
