# Kế hoạch: Khắc phục lỗi Cache Schema RPC và đồng bộ hóa Taxonomy

Lỗi `Could not find the table 'public.rpc_thanh_phan_toan_cuc' in the schema cache` xảy ra do mã nguồn frontend cố gắng truy cập một Database Function (RPC) bằng cú pháp `supabase.from()`. Cú pháp này chỉ hỗ trợ Bảng (Table) hoặc View. Lỗi này phát sinh từ bước tối ưu hiệu năng (Phase 10R) khi áp dụng Keyset Pagination mà chưa chuyển đổi các RPC tương ứng thành View.

## Chỉnh sửa văn bản trực quan
Cập nhật `src/routes/__root.tsx` để hiển thị dòng chữ: "tìm kiếm lỗi và cách khắc phục bước nào tôi sửa code đã làm cho bị lỗi đọc lại lịch sử promt Lỗi tải dữ liệu: Could not find the table 'public.rpc_thanh_phan_toan_cuc' in the schema cache khắc phục nhưng không làm mất dữ liệu , có vẻ do tối ưu bảng" (thay thế nội dung debug cũ).

## Nguyên nhân gốc rễ
Trong Phase 10R, chúng ta đã giới thiệu `fetchKeyset` trong `@/lib/mirats/db/keyset-supabase`. Hàm này sử dụng `client.from(cfg.bang)`, điều này bắt buộc `cfg.bang` phải là một Table hoặc View để Supabase PostgREST engine có thể phân tích schema. Các RPC hiện tại (`rpc_thanh_phan_toan_cuc`, `rpc_tai_san_toan_cuc`) trả về `SETOF jsonb` hoặc `SETOF record` nên không thể dùng trực tiếp với `.from()`.

## Giải pháp: Chuyển đổi RPC thành Views
Chuyển đổi các logic truy vấn phức tạp từ RPC sang Postgres Views chuẩn. Views hỗ trợ đầy đủ các bộ lọc của Supabase (`.eq()`, `.ilike()`, `.or()`) và tương thích hoàn toàn với Keyset Pagination.

### 1. Di trú cơ sở dữ liệu (Database Migration)
- Tạo file migration: `supabase/migrations/20260822120000_convert_rpc_to_views.sql`.
- Xóa các hàm: `rpc_thanh_phan_toan_cuc` và `rpc_tai_san_toan_cuc`.
- Tạo các view tương ứng: `v_thanh_phan_toan_cuc` và `v_tai_san_toan_cuc`.
- Sử dụng `security_invoker = on` để View tuân thủ các chính sách RLS của bảng gốc.
- Cấp quyền `SELECT` cho vai trò `authenticated` và `service_role`.

### 2. Cập nhật mã nguồn Frontend
- Cập nhật `src/components/mirats/ThanhPhanTable.tsx`: Thay đổi tên bảng từ `rpc_thanh_phan_toan_cuc` thành `v_thanh_phan_toan_cuc` và `rpc_tai_san_toan_cuc` thành `v_tai_san_toan_cuc` trong các hàm `useInfinite...`.
- Cập nhật `src/routes/__root.tsx` với văn bản yêu cầu của người dùng.

### 3. Kiểm tra và xác nhận
- Chạy `npm run build:dev` để xác nhận không lỗi biên dịch.
- Dùng Playwright kiểm tra route `/he-thong/thanh-phan` (nếu có) hoặc các nơi nhúng `ThanhPhanTable` để đảm bảo dữ liệu hiển thị đúng.

## Tác động và An toàn dữ liệu
- **KHÔNG MẤT DỮ LIỆU**: Việc chuyển đổi này chỉ thay đổi "cửa sổ" nhìn vào dữ liệu (View). Dữ liệu thực tế nằm trong `thiet_bi`, `he_thong_thanh_phan`, `gan_chuc_nang`... hoàn toàn không bị ảnh hưởng.
- **Tính năng**: Giữ nguyên 100% các cột và logic tính toán (ví dụ: `tyLeTuoiTho`, `anomalyScore`).
- **Hiệu năng**: Cải thiện tốc độ tải trang nhờ khả năng tối ưu hóa thực thi của View so với Function trong nhiều trường hợp.
