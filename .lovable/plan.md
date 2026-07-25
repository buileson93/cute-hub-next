# Kế hoạch redesign Dashboard `/tong-quan`

Mục tiêu: chuyển từ "8 KPI + 3 biểu đồ chung chung" sang trang **điều hành khai thác** — kỹ thuật viên/trưởng ca mở lên biết ngay: hôm nay cần làm gì, thiết bị nào đang có vấn đề, hạn nào sắp tới, sức khoẻ hệ thống ra sao.

## 1. Bố cục mới (top → bottom)

```text
┌─ Thanh lọc: Đơn vị (multi) │ Khoảng TG │ Ca trực │ Làm mới ─┐
├─ ROW 1  BRIEF HÔM NAY (băng ngang, 4 ô lớn) ────────────────┤
│  Việc của tôi hôm nay │ Sự cố mở khẩn │ PM hôm nay │ Hạn 7d │
├─ ROW 2  SỨC KHOẺ KHAI THÁC (2 cột) ─────────────────────────┤
│  Availability / MTBF / MTTR │ Tỉ lệ tài sản khả dụng (donut)│
├─ ROW 3  SỰ CỐ & BẢO TRÌ (2 cột) ────────────────────────────┤
│  Xu hướng sự cố 12 tháng    │ Heatmap sự cố theo giờ×thứ    │
│  (stack theo mức độ)        │ (nhận diện khung giờ nóng)    │
├─ ROW 4  HẠN & TUÂN THỦ (3 cột) ─────────────────────────────┤
│  Timeline giấy phép 90d    │ Kiểm định sắp tới │ Hiệu lực % │
├─ ROW 5  HOTSPOT (2 cột) ────────────────────────────────────┤
│  Top hệ thống nhiều sự cố  │ Top thiết bị hỏng lặp (>=3/90d)│
├─ ROW 6  DÒNG THỜI GIAN (feed) ──────────────────────────────┤
│  Hoạt động gần đây: sự cố mới, PM done, bàn giao, thay đổi  │
└─────────────────────────────────────────────────────────────┘
```

Mobile: gộp về 1 cột, ưu tiên ROW 1 và ROW 4.

## 2. Nội dung nghiệp vụ mới (thêm so với hiện tại)

**Brief hôm nay (theo user + ca trực)**
- Việc của tôi: PM assign cho tôi + sự cố tôi phụ trách + ticket chờ tôi duyệt.
- Sự cố khẩn: `muc_do IN (cao, nghiem_trong)` và `trang_thai` mở.
- PM hôm nay: `pm_cong_viec.han_hoan_thanh = today`.
- Hạn 7 ngày: giấy phép + kiểm định + PM gộp một số.

**Sức khoẻ khai thác (KPI ngành)**
- Availability % = 1 − (giờ ngừng khai thác / giờ vận hành) theo `thiet_bi_vong_doi`.
- MTBF (mean time between failures) theo `su_co` đã đóng.
- MTTR (mean time to repair) = avg(`at_hoan_thanh` − `at_bao_cao`).
- Compliance % = (chứng chỉ + giấy phép còn hiệu lực) / tổng.

**Sự cố nâng cao**
- Heatmap 24×7 theo giờ báo cáo → phát hiện khung giờ nóng.
- Xu hướng có so sánh kỳ trước (mũi tên ▲▼ %).

**Hạn & tuân thủ (thay 2 KPI card đơn)**
- Timeline ngang 90 ngày với marker theo loại (giấy phép, chứng chỉ, kiểm định), tô đỏ nếu quá hạn.
- Danh sách kiểm định sắp tới (top 10).

**Hotspot**
- Top thiết bị hỏng lặp: `count(*) filter (where at_bao_cao >= now()-90d) >= 3` group by `thiet_bi_id`.
- Top hệ thống giữ nguyên nhưng thêm cột MTTR trung bình.

**Feed hoạt động (mới)**
- Union 5 nguồn (sự cố, bảo trì hoàn thành, bàn giao, thay đổi cây, kiểm kê) — 20 dòng gần nhất, click mở chi tiết.

## 3. Backend — RPC mới / mở rộng

Tất cả `SECURITY INVOKER`, tham số `p_don_vi_ids uuid[]`, `p_from date`, `p_to date`, `GRANT EXECUTE TO authenticated`.

| RPC | Trả về | Ghi chú |
|---|---|---|
| `dashboard_brief_today(p_user_id)` | jsonb | 4 số cho ROW 1, lọc theo user + scope |
| `dashboard_health(p_don_vi_ids, p_from, p_to)` | jsonb `{availability, mtbf_h, mttr_h, compliance_pct, prev_*}` | so sánh kỳ trước cùng độ dài |
| `dashboard_su_co_heatmap(p_don_vi_ids, p_days)` | table(dow int, hour int, so_luong int) | mặc định 90 ngày |
| `dashboard_expiry_timeline(p_don_vi_ids, p_days)` | table(loai text, ref_id uuid, ten text, ngay_het date, days_left int) | union giấy phép + chứng chỉ + kiểm định |
| `dashboard_top_thiet_bi_hong_lap(p_don_vi_ids, p_limit)` | table(thiet_bi_id, ma, ten, so_lan, mttr_h) | 90 ngày |
| `dashboard_top_he_thong_su_co` | **mở rộng** thêm `mttr_h` | giữ signature cũ + column mới |
| `dashboard_activity_feed(p_don_vi_ids, p_limit)` | table(at timestamptz, loai text, tieu_de text, ref_route text, ref_id uuid) | union 5 nguồn |

Giữ nguyên `dashboard_kpis`, `dashboard_su_co_by_month`, `dashboard_asset_status` (dùng lại cho ROW 2 donut và ROW 3 trend).

Index gợi ý (chỉ thêm nếu EXPLAIN cho thấy seq scan):
- `su_co(at_bao_cao)`, `su_co(at_hoan_thanh)`, `pm_cong_viec(han_hoan_thanh, trang_thai)`.

## 4. Frontend

- File duy nhất: `src/routes/_app.tong-quan.tsx` — refactor tại chỗ, không đổi route.
- Chia thành các component nhỏ trong `src/components/mirats/dashboard/`:
  `BriefRow.tsx`, `HealthRow.tsx`, `IncidentRow.tsx` (trend + heatmap), `ExpiryTimeline.tsx`, `HotspotRow.tsx`, `ActivityFeed.tsx`, `KpiTile.tsx`.
- Data: mỗi hàng 1 `useQuery` gọi RPC riêng, `loader` prefetch song song bằng `ensureQueryData`.
- Recharts đã có; heatmap tự vẽ bằng grid CSS (không thêm lib).
- Empty state + skeleton cho từng hàng.
- URL search giữ nguyên `?days&donVi`, thêm `?ca=sang|chieu|dem` (không bắt buộc).
- A11y: mọi số KPI có `aria-label` đầy đủ; timeline có bảng tương đương ẩn cho screen reader.

## 5. Nghiệp vụ ràng buộc

- Tôn trọng RLS: đơn vị `PBA/PLK` chỉ thấy phần scope; admin thấy tất cả.
- "Việc của tôi" dựa trên `auth.uid()` trong RPC — không nhận từ client.
- Ngưỡng khẩn cấp lấy từ `thong_bao_cau_hinh` nếu có, fallback hard-code (cao/nghiêm trọng).
- Timezone `Asia/Ho_Chi_Minh` cho mọi bucket ngày/giờ.

## 6. Tiến độ triển khai

1. **BƯỚC 1 — DB (1 migration)**: thêm 6 RPC mới + mở rộng `dashboard_top_he_thong_su_co`. Test bằng `supabase--read_query` với user thật.
2. **BƯỚC 2 — Component tách**: tạo 7 component + `KpiTile` dùng chung. Chưa gắn dữ liệu.
3. **BƯỚC 3 — Wire data**: 1 hàng/lần theo thứ tự ROW 1 → ROW 6. Sau mỗi ROW: Playwright screenshot xác nhận.
4. **BƯỚC 4 — Đo hiệu năng**: `EXPLAIN` từng RPC, thêm index nếu cần. Mục tiêu p95 < 1.5s toàn trang.
5. **BƯỚC 5 — Polish**: skeleton, empty state, so sánh kỳ trước, tooltips giải thích công thức MTBF/MTTR/Availability.

## 7. Câu hỏi cần bạn duyệt trước khi mình code

1. **Availability**: tính theo `thiet_bi_vong_doi` (mốc chuyển trạng thái) hay theo tổng thời gian `su_co` mở? — đề xuất theo `thiet_bi_vong_doi` cho chuẩn.
2. **Ca trực**: hệ thống hiện có bảng phân ca không, hay tạm dùng 3 khung giờ cứng (sáng 6–14, chiều 14–22, đêm 22–6)?
3. **"Việc của tôi"**: gom PM + sự cố + ticket duyệt vào 1 ô số, hay tách 3 chip nhỏ trong ô Brief?
4. **Feed hoạt động**: muốn kèm avatar người thao tác không (cần join `profiles`)?
5. Có cần **xuất PDF/PNG** ảnh chụp dashboard cho báo cáo giao ban không?

Duyệt/chỉnh xong mình sẽ vào BƯỚC 1 (viết migration RPC).
