# Kế hoạch: Khắc phục lỗi Cache Schema cho RPC Paging

Lỗi `Could not find the table 'public.rpc_thanh_phan_toan_cuc' in the schema cache` xảy ra do mã nguồn frontend gọi một hàm cơ sở dữ liệu (RPC) bằng cú pháp `supabase.from()`, vốn chỉ dành cho Bảng (Table) hoặc View. Việc này thường xảy ra khi chuyển sang sử dụng `fetchKeyset` để tối ưu hiệu năng.

## Chỉnh sửa văn bản trực quan
Cập nhật `src/routes/__root.tsx` để hiển thị dòng chữ: "viết plan tiếng việt để tôi xem" (thay thế cho nội dung debug cũ).

## Giải pháp kỹ thuật
Chuyển đổi các hàm RPC hiện tại thành các View chuẩn để hỗ trợ cú pháp `supabase.from()` và bộ lọc của Supabase.

### 1. Di trú cơ sở dữ liệu (Database Migration)
- Tạo file migration mới: `supabase/migrations/20260822110000_convert_rpc_to_views.sql`.
- Xóa các hàm: `rpc_thanh_phan_toan_cuc` và `rpc_tai_san_toan_cuc`.
- Tạo các view tương ứng: `v_thanh_phan_toan_cuc` và `v_tai_san_toan_cuc` với logic tương đương nhưng trả về các cột thay vì đối tượng JSONB. Điều này giúp tận dụng tối đa khả năng lọc và sắp xếp của Postgres/Supabase.
- Cấp quyền `SELECT` cho vai trò `authenticated` và `service_role`.

### 2. Cập nhật mã nguồn Frontend
- Cập nhật `src/components/mirats/ThanhPhanTable.tsx` để trỏ đến tên View mới.
- Cập nhật `src/routes/__root.tsx` với văn bản yêu cầu.

### 3. Kiểm tra và xác nhận
- Chạy `npm run build:dev` để đảm bảo không có lỗi biên dịch.
- Kiểm tra giao diện xem dữ liệu có tải đúng và mượt mà không.

## Tác động và An toàn dữ liệu
- **An toàn dữ liệu**: Việc này CHỈ thay đổi cách đọc dữ liệu, không thay đổi hay xóa bất kỳ bản ghi nào trong các bảng gốc như `thiet_bi` hay `he_thong_thanh_phan`.
- **Không mất dữ liệu**: Hoàn toàn an toàn, không rủi ro mất mát thông tin.
- **Hiệu năng**: View giúp Supabase tối ưu hóa việc phân trang và tìm kiếm tốt hơn RPC.
