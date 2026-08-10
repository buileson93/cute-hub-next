# Báo cáo Điều tra Nghi ngờ N16: Logical RPC vs Physical RPC

## 1. Kết quả kiểm tra
Sau khi rà soát mã nguồn (Task T16) và đối chiếu với bản dump CSDL (`supabase/dump/schema.sql`), chúng tôi xác nhận các nghi ngờ của người dùng như sau:

### Những RPC này có thật trên CSDL không?
**KHÔNG.** Các hàm `cap_nhat_field_<loai>`, `chuyen_trang_thai_<loai>`, `bulk_chuyen_trang_thai_<loai>` và `bulk_gan_field_<loai>` **không tồn tại** dưới dạng hàm Postgres vật lý trong bản dump schema (19.348 dòng) cũng như trong kết quả truy vấn trực tiếp từ `pg_proc`.

### Đường mã nào đang gọi chúng và tính năng này có đang vỡ không?
Các hàm này được sinh ra bởi logic "Logical RPC" tại:
- `src/lib/mirats/ui/inline-edit.ts` (Dòng 136, 141): Sinh tên RPC theo mẫu `chuyen_trang_thai_${loai}` và `cap_nhat_field_${loai}`.
- `src/lib/mirats/ui/bulk-actions.ts` (Dòng 145, 157): Sinh tên RPC theo mẫu `bulk_chuyen_trang_thai_${loai}` và `bulk_gan_field_${loai}`.
- `src/components/mirats/InlineField.tsx` (Dòng 76): Thực hiện lời gọi thực tế `supabase.rpc(payload.rpc, payload.args)`.

**Tình trạng:** Tính năng **ĐANG VỠ** (báo lỗi 404/P0001 Function not found) nếu người dùng thực hiện sửa tại chỗ (inline edit) hoặc thao tác hàng loạt (bulk action) trên các bảng này. Tuy nhiên, do hệ thống có cơ chế phân quyền (`canWrite` tại `InlineField.tsx:68`), có thể tính năng này mới chỉ được triển khai khung (boilerplate) mà chưa có hàm backend tương ứng để hỗ trợ.

### Vì sao không nằm trong bản dump?
Bản dump là "nguồn sự thật" về những gì ĐÃ ĐƯỢC CÀI ĐẶT. Việc không thấy các hàm này trong dump khẳng định rằng backend chưa bao giờ triển khai các hàm "tiêu chuẩn" này. Chuỗi `chuyen_trang_thai_van_de` xuất hiện ở dòng 3298 trong `schema.sql` thực tế là một **event name** được ghi vào log qua hàm `log_app_event`, không phải là tên một hàm RPC.

## 2. Phân tích & Đề xuất xử lý

### Rủi ro & Nguyên nhân
Mã nguồn đang giả định sự tồn tại của một lớp "CRUD RPC tiêu chuẩn" (`cap_nhat_field_<loai>`) cho mọi loại tài sản, nhưng thực tế backend chỉ triển khai các hàm nghiệp vụ đặc thù (như `ghi_su_co_atomic`, `lap_tai_san_vao_thanh_phan`).

### Đề xuất xử lý (theo thứ tự rủi ro)

| Phương án | Rủi ro | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **1. Triển khai hàm generic** | Thấp | Khôi phục tính năng inline-edit nhanh cho mọi bảng. | Cần viết thêm SQL boilerplate cho ~10 loại tài sản. |
| **2. Chuyển sang direct UPDATE** | Trung bình | Không cần thêm RPC. | Phá vỡ nguyên tắc "chỉ gọi qua RPC" để giữ RLS và Audit log đồng nhất. |
| **3. Tạm đóng InlineEdit** | Thấp | Chặn lỗi 404 cho người dùng ngay lập tức. | Mất tính năng sửa nhanh, người dùng phải vào form chi tiết. |

**Kết luận:** N16 là một lỗi "sai lệch thiết kế" (Design Mismatch) giữa Frontend (giả định generic RPC) và Backend (triển khai specific RPC).

*Báo cáo được thực hiện trong Task T16 - Đợt 4 (TRẢ NỢ).*
