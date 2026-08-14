# Phục hồi dữ liệu đầy đủ cho Thành phần & Tài sản (Vượt giới hạn 1000 dòng)

Người dùng báo cáo dữ liệu trong database có 1.185 thành phần nhưng bảng chỉ hiển thị 1000. Đây là lỗi phổ biến do giới hạn mặc định của PostgREST (1000 dòng).

## Bối cảnh kỹ thuật
- **Nguyên nhân**: Các hàm RPC (`rpc_thanh_phan_toan_cuc`, `rpc_tai_san_toan_cuc`) và các truy vấn `select` trực tiếp đang không sử dụng cơ chế phân trang (pagination) để lấy toàn bộ dữ liệu.
- **Giải pháp**: 
  1. Sử dụng helper `fetchAllRows` có sẵn trong dự án để lặp lại truy vấn cho đến khi lấy hết dữ liệu.
  2. Đối với RPC, Supabase không hỗ trợ `.range()` trực tiếp trên RPC trả về `jsonb` hoặc `SETOF jsonb` một cách hiệu quả nếu không được thiết kế phân trang ở tầng SQL. Tuy nhiên, RPC hiện tại của dự án trả về `SETOF jsonb`, ta có thể thử áp dụng phân trang hoặc chuyển sang nạp bằng server-side logic nếu cần.

## Các mục cần sửa

### 1. Thành phần & Tài sản (ThanhPhanTable.tsx)
- Cập nhật `useThanhPhanRows` và `useTaiSanRows` trong `src/components/mirats/ThanhPhanTable.tsx`.
- Thay vì gọi `supabase.rpc(...)` một lần, ta sẽ sử dụng một vòng lặp hoặc helper để nạp toàn bộ. 
- *Lưu ý*: PostgREST cho phép dùng `Range` header trên RPC. Ta sẽ kiểm tra xem `rpc_thanh_phan_toan_cuc` có hỗ trợ không.

### 2. Sổ lý lịch (db-taxonomy.ts)
- Hàm `fetchAllThietBi` đã có vòng lặp nhưng cần kiểm tra xem có bị sót ở các bảng khác không.
- Hàm `loadTaxonomy` gọi nhiều bảng `dm_he_thong`, `dm_phan_loai`... nếu các bảng này > 1000 dòng cũng sẽ bị cắt.

### 3. Cây Hệ Thống (_app.he-thong.cay.tsx)
- Truy vấn `thiet_bi_cay` trong `src/routes/_app.he-thong.cay.tsx` đã có vòng lặp `pageSize = 1000`. Cần kiểm tra logic thoát vòng lặp.

## Kế hoạch chi tiết

### Bước 1: Sửa ThanhPhanTable.tsx
- Thay đổi cách gọi RPC trong `useThanhPhanRows` và `useTaiSanRows`.
- Sử dụng helper `fetchAllRows` (hoặc logic tương tự) để nạp dữ liệu từ RPC.

### Bước 2: Kiểm tra các bảng danh mục trong db-taxonomy.ts
- Đảm bảo `dm_he_thong`, `dm_nhom_he_thong`, `dm_vi_tri`... cũng được nạp đầy đủ nếu số lượng lớn.

### Bước 3: Xác minh
- Kiểm tra số lượng dòng hiển thị trong bảng "Thành phần & tài sản" (expecting 1.185+).
- Kiểm tra số lượng node trong Cây hệ thống.
