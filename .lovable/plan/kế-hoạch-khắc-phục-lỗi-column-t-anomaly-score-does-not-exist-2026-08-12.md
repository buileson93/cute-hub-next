# Kế hoạch khắc phục lỗi "column t.anomaly_score does not exist" (T52)

Ứng dụng đang gặp lỗi Runtime Error 500 tại trang Thành phần hệ thống (`/he-thong/thanh-phan`) do hàm RPC truy cập vào cột `anomaly_score` không tồn tại trong bảng `thiet_bi`.

## Nguyên nhân

- Cột `anomaly_score` hiện không có trong lược đồ bảng `public.thiet_bi`.
- Tuy nhiên, dự án có Materialized View `mv_asset_anomaly` lưu trữ `z_score` và `incident_count_90d`.
- Các hàm RPC `rpc_tai_san_toan_cuc` và `rpc_thanh_phan_toan_cuc` đang cố truy cập trực tiếp `t.anomaly_score` thay vì join với view này hoặc sử dụng giá trị mặc định.

## Giai đoạn 1: Sửa lỗi Database (RPC)

Cập nhật migration để các hàm RPC lấy dữ liệu từ `mv_asset_anomaly`.

1. **Sửa `rpc_tai_san_toan_cuc`**:
   - `LEFT JOIN mv_asset_anomaly ma ON ma.asset_id = t.id`.
   - Trả về `ma.z_score` (aliased as `anomalyScore`) thay vì `t.anomaly_score`.
   - Đảm bảo `soSuCo90n` cũng được lấy từ view để đồng bộ nếu cần (hiện tại đang dùng subquery).

2. **Sửa `rpc_thanh_phan_toan_cuc`**:
   - Tương tự, join với `mv_asset_anomaly` thông qua `t.id` (tài sản đang lắp).

## Giai đoạn 2: Cập nhật Frontend

Đảm bảo kiểu dữ liệu trong `ThanhPhanTable.tsx` khớp với dữ liệu thực tế.

- Cập nhật `TaiSanRow` và `ThanhPhanRow` để xử lý trường hợp `anomalyScore` là null hoặc undefined.

## Các bước thực hiện

- Tạo migration `20260812030000_fix_anomaly_score_rpc.sql`.
- Áp dụng migration qua `supabase--migration`.
- Kiểm tra trang `/he-thong/thanh-phan` để xác nhận lỗi 500 biến mất.

## Kỹ thuật chi tiết

```sql
-- Join mẫu trong RPC
LEFT JOIN mv_asset_anomaly ma ON ma.asset_id = t.id
...
'anomalyScore', COALESCE(ma.z_score, 0)
```

## Kiểm tra

- `npx tsc --noEmit` để đảm bảo không lỗi type.
- Chạy script Playwright kiểm tra status code 200 cho route `/he-thong/thanh-phan`.
