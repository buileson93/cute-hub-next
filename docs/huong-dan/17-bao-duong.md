# 17. Bảo dưỡng định kỳ

Đường dẫn: `/bao-tri` (danh sách), `/bao-tri/moi` (tạo), `/bao-tri/cong-viec` (công việc).

## Tạo phiếu bảo dưỡng

1. Vào `/bao-tri` → **+ Tạo phiếu**.
2. Chọn **Hệ thống** cần bảo dưỡng.
3. Hệ thống load **Form động** tương ứng loại hệ thống (mỗi hệ thống có mẫu riêng — xem [29](./29-forms-dong.md)).
4. Điền các trường / checklist.
5. Đính kèm ảnh, ghi chú.
6. Ký người thực hiện → **Lưu**.

## Chính sách chu kỳ

- Admin cấu hình chu kỳ bảo dưỡng tại `/admin/bao-tri-chinh-sach`.
- Khi tới hạn → xuất hiện trong `/sap-het-han` và cảnh báo Telegram.

## Công việc bảo dưỡng

- `/bao-tri/cong-viec` liệt kê task được giao.
- Trạng thái: Chờ → Đang làm → Hoàn tất.
- Idempotent: bấm hoàn tất 2 lần không tạo trùng bản ghi.

## Xuất báo cáo

- Nút **Xuất Word** — biên bản bảo dưỡng theo template hệ thống.
- Nút **Xuất Excel** — báo cáo tháng/quý theo filter.
