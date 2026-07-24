# 09. Danh mục Model

Đường dẫn: `/danh-muc/model`.

## Khái niệm
Model = một dòng sản phẩm cụ thể (ví dụ: "Cisco Catalyst 2960-24TT"). Thiết bị vật lý (TB) đều phải thuộc 1 Model.

## Tạo Model
1. Bấm **+ Thêm Model**.
2. Điền:
   - **Tên Model** (bắt buộc).
   - **Chủng loại** (bắt buộc — có trigger DB đảm bảo `loai_thiet_bi_id` khớp).
   - **Nhà sản xuất**, **Thương hiệu**.
   - **Ảnh đại diện** (paste clipboard + crop, xem [26](./26-anh-thiet-bi.md)).
   - **Nhãn thiết bị** (multi-select, xem [10](./10-nhan-thiet-bi.md)).
3. **Lưu**.

## Tự động tạo Model khi nhập liệu
Khi import Excel, nếu tên Model chưa tồn tại → hệ thống **tự tạo Model mới** với thông tin cơ bản; các Model này xuất hiện tại tab **Thiếu loại** để bổ sung sau.

## Import/Export Nhãn theo Model
1. Vào chi tiết Model → tab **Nhãn thiết bị**.
2. Bấm **Xuất** để tải file XLSX chuẩn (header `nhan_thiet_bi`).
3. Bấm **Nhập** → chọn file. Hệ thống:
   - Chấp nhận header cũ `dac_tinh` và map sang `nhan_thiet_bi`.
   - Hiển thị toast tóm tắt số dòng thành công / bỏ qua.
