# 25. Xuất báo cáo có filter

## Nguyên tắc
Mọi TableView đều có nút **Xuất Excel / CSV** ở PageHeader. File xuất **luôn theo filter/sort/columns hiện tại**.

## Các bước
1. Áp bộ lọc mong muốn (search, chip nhãn, dropdown scope…).
2. Xác nhận số dòng hiển thị ở góc dưới bảng.
3. Bấm **Xuất** → chọn định dạng:
   - **XLSX**: giữ định dạng, dropdown, có sheet metadata (phiên bản, timestamp).
   - **CSV**: chỉ dữ liệu.
4. File tải xuống có tên `{module}_{YYYYMMDD}_{HHmm}.xlsx`.

## Nạp lại
- Bấm **Nhập** trên cùng TableView → chọn file vừa xuất → preview → xác nhận.
- Schema tương thích 2 chiều.

## Xuất Word (biên bản)
- Có ở: Sự cố (BÁO CÁO BAN ĐẦU), Bảo dưỡng, Bàn giao, Kiểm định.
- Template lưu trong `/admin/forms`.
