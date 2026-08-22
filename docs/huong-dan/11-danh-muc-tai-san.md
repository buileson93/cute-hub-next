# 11. Danh mục Tài sản (Thiết bị vật lý)

Đường dẫn: `/danh-muc/thiet-bi`.

## Khái niệm

Tài sản = thiết bị vật lý cụ thể có mã `TB_XXXXXXXX`, serial, ngày mua… Thuộc 1 Model, có thể gán vào một Vị trí trong Hệ thống.

## Tạo thiết bị

1. Bấm **+ Thêm tài sản**.
2. Điền:
   - **Model** (bắt buộc — chọn từ dropdown; nếu chưa có, tạo Model trước).
   - **Serial**, **Số lô**.
   - **Ngày mua**, **Ngày bảo hành đến**.
   - **Đơn vị sở hữu**.
   - **Ảnh** (paste + crop).
3. **Lưu** — hệ thống sinh `TB_XXXXXXXX`.

## Sửa nhanh (Inline)

- Trong list view, bấm ô cần sửa → chỉnh trực tiếp → Enter/Blur để lưu.

## Bulk edit

1. Tick nhiều dòng → BulkActionBar hiện.
2. Chọn **Sửa hàng loạt** (đổi đơn vị, đổi Model, gán nhãn…).
3. Xem preview → **Xác nhận** → **Hoàn tác** nếu cần.

## Xuất / Nhập

- **Xuất filter hiện tại**: bấm **Xuất Excel** — chỉ xuất dòng đã lọc.
- **Nhập**: dùng file **All-in-one** ([24](./24-nhap-lieu-allinone.md)).

## Cột hiển thị

- Bấm **⋯ → Cột hiển thị** để ẩn/hiện. Cài đặt được **lưu theo tài khoản**.

## Xóa thiết bị

- Hard delete bị chặn — dùng RPC `xoa_thiet_bi_theo_giao_thuc(ma_thiet_bi, ly_do)`.
- Menu `⋯ → Loại bỏ khỏi hệ thống` sẽ mở dialog yêu cầu lý do.
