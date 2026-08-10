# Kế hoạch T16: Điều tra và Báo cáo Nghi ngờ N16

## Mục tiêu
Điều tra nghi ngờ N16 về sự tồn tại của các RPC "Logical" trong mã nguồn nhưng không có trong CSDL. Báo cáo chi tiết về nguyên nhân, ảnh hưởng và đề xuất xử lý.

## Các bước thực hiện
1. **Rà soát mã nguồn:** Đã xác định vị trí sinh tên RPC tại `src/lib/mirats/ui/inline-edit.ts` và `src/lib/mirats/ui/bulk-actions.ts`.
2. **Đối chiếu CSDL:** Đã kiểm tra `supabase/dump/schema.sql` và chạy query `pg_proc` trên live DB, xác nhận không tồn tại các hàm này.
3. **Phân tích ảnh hưởng:** Xác định tính năng Inline Edit và Bulk Action trên một số bảng đang bị lỗi (vỡ) do thiếu backend hỗ trợ.
4. **Viết báo cáo:** Tổng hợp kết quả vào file `docs/handbook/06-bai-hoc-kinh-nghiem-N16.md`.

## Kết quả
- Một bản báo cáo chi tiết kèm dẫn chứng file/dòng.
- Không sửa bất kỳ file mã nguồn nào (Tuân thủ luật Task CHỈ ĐỌC).
