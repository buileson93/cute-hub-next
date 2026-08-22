# Kế hoạch Phân hạng Lộ trình Mobile (Phase U6 - Giai đoạn 2)

Việc: Phân hạng toàn bộ 118 route theo mức độ cần thiết trên điện thoại (G1/G2/G3).
Phạm vi: Chỉ tạo file `docs/ui/phan-hang-mobile.md`, không sửa code `src/`.

## Các bước thực hiện

1. **Khảo sát Route (Đã thực hiện sơ bộ):**
   - Liệt kê toàn bộ các file trong `src/routes`.
   - Lọc bỏ các file hệ thống, API, layout thuần túy để đạt con số ~118 route chức năng.

2. **Phân loại Chi tiết:**
   - **G1 (Mobile First):** Tra cứu, ghi nhanh, sự cố, thông báo.
   - **G2 (Mobile Read-only):** Dashboard, báo cáo tĩnh, KPI.
   - **G3 (Desktop Only):** Sơ đồ, cây hệ thống, quản trị, cấu hình phức tạp.

3. **Lập bảng đối soát:**
   - Ánh xạ từng route với: Tên trang, Hạng đề xuất, Lý do, Sử dụng Table/Form.

4. **Tổng hợp đề xuất G1:**
   - Chọn ra 8 trang quan trọng nhất cần ưu tiên tối ưu mobile.

5. **Xác định vùng không chắc chắn:**
   - Liệt kê các route cần ý kiến từ dữ liệu truy cập thực tế của người dùng.

## Chi tiết kỹ thuật

- File đầu ra: `docs/ui/phan-hang-mobile.md`.
- Sử dụng dữ liệu từ `rg` và `find` để kiểm tra sự tồn tại của `StandardTable` và thẻ `form`.
