# Kế hoạch T5: Xuất lại schema đồng bộ với CSDL thực

Bối cảnh: Sau khi đã sửa lỗi ở migration T3 và T4, chúng ta cần cập nhật `supabase/dump/schema.sql` để phản ánh đúng trạng thái CSDL hiện tại (Nguồn sự thật).

## Trạng thái hiện tại

- File `supabase/dump/schema.sql` cũ: 19,348 dòng (chưa có các thay đổi từ 5 migration mới nhất).
- Các mục cần bổ sung: 2 bảng mới, 2 cột mới, 2 hàm mới và 3 giá trị ENUM.

## Các bước thực hiện

1. **Kiểm tra tiền đề**: Xác nhận migration `20260810000000` (T3) và `20260810041252` (T4) đã được sửa đúng. (ĐÃ XONG)
2. **Xuất schema mới**: Chạy script `scripts/export-schema.sh` và ghi đè vào `supabase/dump/schema.sql`. (ĐÃ XONG)
3. **Xác minh kết quả**:
   - So sánh số lượng dòng: Dự kiến tăng (Hiện tại: 23,010 dòng).
   - Kiểm tra sự hiện diện của 6 hạng mục bắt buộc:
     - Bảng `nhiem_vu_nhap_lieu`.
     - Bảng `dong_gop_diem`.
     - Cột `completeness_pct` trong bảng `thiet_bi` và `dm_he_thong`.
     - Hàm `calculate_completeness`.
     - Hàm `get_completeness_stats`.
     - 3 giá trị ENUM: `thiet_bi.propose_field`, `he_thong.propose_field`, `dm.propose_new`.

## Tiêu chí hoàn thành

- File `supabase/dump/schema.sql` được cập nhật.
- Cả 6 mục trên đều tìm thấy trong file mới.
- Không có lỗi cú pháp hoặc thiếu sót so với migration.
