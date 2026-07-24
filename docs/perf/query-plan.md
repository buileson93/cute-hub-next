# Task 44 — Kế hoạch truy vấn CSDL nâng cao

Mục tiêu: giữ mọi truy vấn danh sách/dashboard nhanh khi dữ liệu tăng
(hàng nghìn → hàng triệu dòng).

## 1. Nguyên tắc chung

| Chống mẫu | Cách làm đúng |
| --- | --- |
| `SELECT *` | Chỉ select cột thật sự dùng; giảm băng thông & pluck plan |
| `OFFSET N` lớn | Keyset: `WHERE (sortField, id) < (lastValue, lastId)` |
| Tính tổng hợp mỗi lần render | Materialized view + refresh định kỳ |
| Index đơn theo từng cột filter | Composite/partial index khớp `WHERE + ORDER BY` |

## 2. Index mới (migration `indexes_nangcao`)

| Bảng | Index | Tại sao |
| --- | --- | --- |
| `thiet_bi` | `(created_at DESC, id DESC)` | keyset danh sách tài sản |
| `thiet_bi` | `(don_vi_id, created_at DESC, id DESC)` | list-view theo đơn vị + phân trang |
| `bao_tri` | `(created_at DESC, id DESC) WHERE luu_tru IS NULL/false` | chỉ biên bản hiện hành |
| `su_co` | `(created_at DESC, id DESC) WHERE luu_tru IS NULL/false` | như trên |
| `cong_viec_bao_tri` | `(don_vi_id_snapshot, trang_thai, ngay_den_han)` | KPI đúng hạn / quá hạn |
| `kho_giao_dich` | `(kho_id, vat_tu_id, created_at DESC, id DESC)` | tồn kho gộp + sổ giao dịch |
| `giay_phep_khai_thac` | `(gp_han) WHERE gp_han IS NOT NULL` | cảnh báo sắp hết hạn |

## 3. Materialized view (migration `matview_tonghop`)

| MV | Nội dung | Ai đọc |
| --- | --- | --- |
| `mv_ton_kho_tong` | SUM(hieu_ung) theo (vat_tu, kho, don_vi) + join `vat_tu`, `kho` | trang tồn kho, KPI kho |
| `mv_kpi_bao_tri` | tổng / đang mở / quá hạn / tỷ lệ đúng hạn theo đơn vị | dashboard vận hành |

- Refresh qua RPC `refresh_mv_tonghop()` — `SECURITY DEFINER`, chỉ admin
  hoặc `service_role` được gọi, dùng `REFRESH ... CONCURRENTLY`.
- Có thể lịch bằng `pg_cron` (VD 15 phút/lần) hoặc gọi từ trigger sau ghi
  vào `kho_giao_dich` / `cong_viec_bao_tri` khi cần realtime hơn.

## 4. Keyset pagination

- Logic thuần: `src/lib/mirats/db/keyset.ts` (12 test xanh).
- Wrapper Supabase: `src/lib/mirats/db/keyset-supabase.ts` — dùng `.order()` +
  `.or()` để phát `(sortField, id) op (lastValue, lastId)`.
- Trang mã hoá `cursor` bằng base64 → gắn được vào `?cursor=...` trên URL.

## 5. Đo trước/sau (mẫu ghi lại)

Chạy `EXPLAIN (ANALYZE, BUFFERS)` trên query nóng trước và sau khi thêm
index. Ghi kết quả vào bảng dưới khi có số thật.

| Truy vấn | Trước (ms) | Sau (ms) | Ghi chú |
| --- | --- | --- | --- |
| `thiet_bi` list theo đơn vị + trang 20 | _pending_ | _pending_ | dùng idx composite |
| KPI bảo dưỡng theo đơn vị | _pending_ | _pending_ | đọc từ `mv_kpi_bao_tri` |
| Tồn kho gộp theo kho | _pending_ | _pending_ | đọc từ `mv_ton_kho_tong` |
| Giấy phép sắp hết hạn ≤ 30 ngày | _pending_ | _pending_ | partial idx trên `gp_han` |

Ở quy mô hiện tại (828 tài sản), khác biệt không lớn — mục tiêu là an toàn
khi dữ liệu tăng 10–100 lần.
