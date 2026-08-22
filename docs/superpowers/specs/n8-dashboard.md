# N8 — Dashboard Tổng quan (SPEC)

Trạng thái: DRAFT — chờ duyệt trước khi migration/TDD.
Route đích: `/tong-quan` (SSR, thuộc `_app`, yêu cầu đăng nhập). Trang landing `_app.index.tsx` sẽ redirect tới `/tong-quan` sau khi spec được duyệt.

## 1. Mục tiêu

Một trang tổng quan duy nhất, tải nhanh (< 1.5s p95), truy vấn tổng hợp phía DB, tôn trọng RLS theo đơn vị hiện tại của user. Không kéo dữ liệu thô về client để đếm.

## 2. Bộ lọc

- **Đơn vị** (`don_vi_id`): mặc định = tất cả đơn vị user có quyền (theo `user_scope` / RLS).
- **Khoảng thời gian**: preset 30/90/365 ngày; dùng cho biểu đồ xu hướng và chỉ số "sự cố mới". Không ảnh hưởng chỉ số tồn kho (tổng tài sản, đang hoạt động…).
- Bộ lọc là tham số vào RPC; không lọc client-side.

## 3. Danh sách chỉ số (KPI cards)

| Mã                  | Tên hiển thị             | Nguồn                                                 | Định nghĩa                                                                                         |
| ------------------- | ------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `tong_tai_san`      | Tổng tài sản             | `thiet_bi`                                            | `count(*)` các thiết bị chưa xoá mềm, thuộc đơn vị lọc (join qua `dm_he_thong.don_vi_id` nếu cần). |
| `dang_hoat_dong`    | Đang hoạt động           | `thiet_bi` × `dm_trang_thai_thiet_bi`                 | Trạng thái nhóm `hoat_dong`.                                                                       |
| `ngung_khai_thac`   | Ngừng khai thác          | `thiet_bi` × `dm_trang_thai_thiet_bi`                 | Trạng thái nhóm `ngung_khai_thac` / `hu_hong`.                                                     |
| `su_co_mo`          | Sự cố mở                 | `su_co`                                               | Trạng thái ∈ {`bao_cao`,`tiep_nhan`,`dang_xu_ly`,`cho_vat_tu`} (theo N6).                          |
| `pm_den_han`        | PM đến hạn (≤7 ngày)     | `pm_cong_viec` (N4) hoặc fallback `cong_viec_bao_tri` | `han_hoan_thanh` giữa hôm nay và +7 ngày, chưa hoàn thành.                                         |
| `pm_qua_han`        | PM quá hạn               | như trên                                              | `han_hoan_thanh < today` và chưa hoàn thành.                                                       |
| `sap_het_han`       | Mục sắp hết hạn ≤30 ngày | `v_sap_het_han` (N5)                                  | `days_left BETWEEN 0 AND 30`.                                                                      |
| `qua_han_giay_phep` | Giấy phép quá hạn        | `v_giay_phep` (N5)                                    | `days_left < 0`.                                                                                   |

Nếu N4/N5 chưa merge, dùng fallback nguồn cũ (`bao_tri`, `giay_phep_khai_thac`, `chung_chi_thiet_bi`). SPEC ghi rõ để không block N8.

## 4. Biểu đồ

- **Xu hướng sự cố theo tháng (12 tháng gần nhất)**: cột chồng theo `muc_do` (thấp/trung bình/cao/nghiêm trọng) hoặc theo `trang_thai` cuối kỳ. Nguồn: `su_co.at_bao_cao` (fallback `created_at`). Bucket = `date_trunc('month', ...)` theo TZ `Asia/Ho_Chi_Minh`.
- **Phân bổ trạng thái tài sản**: donut/bar từ `dashboard_asset_status()`.
- **Top 5 hệ thống có nhiều sự cố mở**: bar ngang, click → `/he-thong/$id`.

Tất cả biểu đồ nhận dữ liệu đã tổng hợp từ RPC (không tự group ở client).

## 5. Truy vấn tổng hợp (DB layer)

Tất cả là **SECURITY INVOKER** để RLS áp dụng theo caller.

### 5.1 RPC (tham số: `p_don_vi_ids uuid[] default null`, `p_from date`, `p_to date`)

- `dashboard_kpis(p_don_vi_ids, p_from, p_to) returns jsonb`
  Trả về 1 hàng JSON gồm tất cả KPI ở §3. Dùng CTE + `count(*) FILTER (WHERE ...)`.
- `dashboard_su_co_by_month(p_don_vi_ids, p_months int default 12) returns table(thang date, muc_do text, so_luong int)`
- `dashboard_asset_status(p_don_vi_ids) returns table(trang_thai_ma text, ten text, so_luong int)`
- `dashboard_top_he_thong_su_co(p_don_vi_ids, p_limit int default 5) returns table(he_thong_id uuid, ten_he_thong text, so_su_co_mo int)`

`p_don_vi_ids = null` ⇒ tất cả đơn vị user có quyền (RLS lọc).

### 5.2 View (tuỳ chọn nội bộ)

- `v_thiet_bi_don_vi` (nếu chưa có): join `thiet_bi` với `dm_he_thong` để có `don_vi_id` gián tiếp — hỗ trợ đếm theo đơn vị. Không expose ra API; chỉ dùng trong RPC.

### 5.3 RLS/GRANT

- `GRANT EXECUTE ON FUNCTION dashboard_* TO authenticated`.
- RPC không dùng `SECURITY DEFINER`; dữ liệu trả về = những gì user được đọc theo RLS bảng gốc.
- Không tạo policy mới trên bảng nguồn.

### 5.4 Hiệu năng

- Index gợi ý: `su_co(at_bao_cao)`, `su_co(trang_thai) WHERE trang_thai IN (...)`, `thiet_bi(trang_thai_id)`. Chỉ thêm nếu `EXPLAIN` cho thấy seq scan trên bảng > 100k dòng.
- Không materialized view ở giai đoạn N8; đánh giá lại sau khi đo.

## 6. Client (route `/tong-quan`)

- `createFileRoute('/_app/tong-quan')` với `loader` dùng `ensureQueryData` cho 4 RPC (song song).
- `useSuspenseQuery` trong component. Filter đơn vị là URL search param `?don_vi=<uuid,uuid>` — thay đổi filter ⇒ `router.navigate` (không reload).
- Bộ Card + Recharts (đã có trong repo) cho biểu đồ. Không thư viện mới.
- Compact mode + tông xanh VATM.

## 7. Test kế hoạch (BƯỚC 2)

- `src/lib/mirats/__tests__/dashboard-metrics.test.ts`: seed bộ dữ liệu nhỏ trong transaction, gọi từng RPC, khẳng định số lượng.
- pgTAP (nếu repo có): 1 test file `supabase/tests/dashboard.sql` kiểm tra RLS — user đơn vị A không thấy số của đơn vị B.
- Không đổi test hiện có; giữ nav-contract nguyên vẹn (chỉ thêm mục "Tổng quan" nếu đã có test đặc tả cho phép).

## 8. Câu hỏi làm rõ

1. Chỉ số **PM** dùng nguồn nào ở giai đoạn này — `cong_viec_bao_tri` (đang có) hay chờ N4 merge?
2. Chỉ số **Sắp hết hạn** dùng `v_sap_het_han` (N5) hay tính trực tiếp từ `chung_chi_thiet_bi` + `giay_phep_khai_thac`?
3. Biểu đồ xu hướng gom theo **`muc_do`** hay theo **`trang_thai` cuối kỳ**? (đề xuất: `muc_do`, dễ đọc hơn)
4. `/tong-quan` có thay thế `/` (redirect) hay tồn tại song song với landing hiện tại?
5. Filter đơn vị **multi-select** hay single? (đề xuất: multi, mặc định = tất cả trong quyền)
6. Có cần export CSV cho từng biểu đồ không?
7. Có nhóm role nào bị chặn thấy dashboard (ví dụ `khach`)?

Chờ duyệt spec + câu trả lời trước khi sang BƯỚC 2 (migration + test).
