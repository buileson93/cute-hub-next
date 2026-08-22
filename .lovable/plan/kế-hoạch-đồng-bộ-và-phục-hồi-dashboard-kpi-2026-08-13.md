---
name: Unify Dashboard and KPI Logic
description: Restore 100% parity between index and tong-quan routes while unifying the data calculation layer to prevent discrepancies.
type: feature
---

# Kế hoạch Đồng bộ và Phục hồi Dashboard KPI

Bối cảnh: Dự án đang có hai màn hình tổng quan (`index.tsx` và `tong-quan.tsx`) với sự trùng lặp lớn về chỉ số nhưng có nguy cơ sai lệch số liệu do tính toán riêng rẽ. Bản `tong-quan.tsx` hiện tại bị rút gọn quá mức so với yêu cầu 900 dòng của người dùng.

## 1. Bảng đối chiếu chỉ số và biểu đồ

| Tên chỉ số             | Có ở index | Có ở tong-quan | Nguồn dữ liệu                   | Cách tính                               | Trùng lặp/Khác biệt |
| :--------------------- | :--------: | :------------: | :------------------------------ | :-------------------------------------- | :------------------ |
| **Availability**       |     Có     |       Có       | `scope.suCo` + `devices`        | `availability()` trong `reliability.ts` | Trùng lặp           |
| **MTTR**               |     Có     |       Có       | `scope.suCo`                    | `mttr()` trong `reliability.ts`         | Trùng lặp           |
| **MTBF**               |     Có     |       Có       | `scope.suCo`                    | `mtbf()` trong `reliability.ts`         | Trùng lặp           |
| **PM đúng hạn**        |     Có     |       Có       | `cong_viec_bao_tri`             | `usePmOnTimeKpi`                        | Trùng lặp           |
| **Health A/B/C/D**     |     Có     |       Có       | `scope.thietBi`                 | `healthDetail()` trong `metrics.ts`     | Trùng lặp           |
| **Sự cố khẩn**         |     Có     |     Không      | `rpc: dashboard_brief_today`    | Trực tiếp từ backend                    | Duy nhất index      |
| **Chất lượng dữ liệu** |     Có     |     Không      | `rpc: get_completeness_stats`   | Trực tiếp từ backend                    | Duy nhất index      |
| **Xu hướng sự cố**     |  Có (Bar)  |  Có (Pie/Bar)  | `rpc: dashboard_su_co_by_month` | Group theo tháng/mức độ                 | Trùng lặp           |
| **Nhật ký Live**       |     Có     |     Không      | `LiveTimeline`                  | Query realtime                          | Duy nhất index      |

## 2. Rủi ro tính toán sai lệch

- **Reliability KPIs**: `index.tsx` đang tính toán client-side bằng `useMemo`. Nếu `tong-quan.tsx` dùng RPC `dashboard_health`, số liệu chắc chắn sẽ lệch nhau vài % do logic "cửa sổ thời gian" (windowHours) và cách xử lý sự cố đang mở khác nhau giữa JS và PL/pgSQL.
- **Health Score**: Cần đảm bảo `healthDetail` dùng chung bộ trọng số (weights) và logic fallback khi thiếu ngày đưa vào sử dụng.

## 3. Danh sách Hook dữ liệu cần tách

- `useUnifiedDashboardStats`: Tổng hợp Availability, MTTR, MTBF, PM Rate dựa trên `useScope`.
- `useAssetHealthDistribution`: Tính toán mảng A/B/C/D từ danh sách thiết bị hiện tại trong scope.

## 4. Khuyến nghị phương án: Phương án C (Hybrid)

**Lý do**: Người dùng muốn giữ cả hai nhưng không chấp nhận mất tính năng. `index.tsx` sẽ đóng vai trò **"Brief hôm nay"** (hành động nhanh), còn `tong-quan.tsx` là **"Báo cáo toàn cảnh"** (phân tích sâu). Cả hai dùng chung 100% logic tính toán.

### Kế hoạch Commit:

1.  **Commit 1**: Tạo `src/lib/mirats/use-dashboard-unified.ts` để gom toàn bộ logic tính toán KPI từ `index.tsx` ra ngoài.
2.  **Commit 2**: Phục hồi bản đầy đủ của `_app.tong-quan.tsx` (900 dòng) dựa trên mã nguồn "chaytot", kết nối nó vào Unified Hook.
3.  **Commit 3**: Đồng bộ visual (Icon, Card, Spacing) để cả hai trang có cảm giác cùng một hệ thống (SnowUI style).

## 5. Danh sách kiểm tra Parity (Không được mất)

- [ ] 4 thẻ KPI Reliability (Avail, MTTR, MTBF, PM).
- [ ] Khối "Hôm nay có gì cháy?" (Sự cố khẩn).
- [ ] Khối "Tuần này làm gì?" (PM đến hạn).
- [ ] Biểu đồ Health Distribution A/B/C/D với thanh progress màu sắc.
- [ ] Tab switch giữa "Xu hướng sự cố" và "Trạng thái tài sản".
- [ ] Bảng "Thiết bị cần chú ý" (Health C/D).
- [ ] HeartBeatStrip (Dải nhịp tim hệ thống).
- [ ] LiveTimeline (Nhật ký vận hành).
