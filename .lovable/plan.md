# Kế hoạch Tinh gọn và Chuẩn hoá Dashboard (SnowUI Style)

Mục tiêu: Đạt được giao diện dashboard sạch, bớt chữ, tập trung vào con số và biểu đồ sparkline, loại bỏ sự lộn xộn về font chữ và layout.

## 1. Đặc tả Component KpiCard
Tạo `src/components/mirats/dashboard/KpiCard.tsx` để dùng chung.

### Props
- `title`: string (Bắt buộc, tối đa 3 từ)
- `value`: string | number (Bắt buộc)
- `unit`: string (Tùy chọn)
- `icon`: string (Tên icon trong registry)
- `trend`: { value: number, isUp: boolean } (Tùy chọn)
- `target`: string (Tùy chọn, ví dụ "Target: 99%")
- `sparklineData`: any[] (Tùy chọn, chuỗi thời gian cho sparkline)
- `description`: string (Tùy chọn, hiển thị qua Tooltip)
- `status`: "normal" | "warning" | "danger" | "info"

### Hành vi
- Nếu thiếu `sparklineData`: Ẩn vùng sparkline, giữ chiều cao card cố định.
- Nếu `value` đang load: Hiển thị skeleton hoặc "...".

## 2. Thang chữ 4 bậc
| Bậc | Vai trò | Cỡ (px) | Tailwind class |
|-----|---------|---------|----------------|
| 1 | Số chỉ số chính | 26px | `text-2xl font-black tabular-nums` |
| 2 | Tiêu đề thẻ | 13px | `text-[13px] font-bold uppercase tracking-wide` |
| 3 | Nội dung chính | 12px | `text-[12px] font-medium` |
| 4 | Nhãn/Chú thích | 11px | `text-[11px] font-medium text-muted-foreground` |

## 3. Bảng rà soát rút gọn chữ
| Nội dung hiện tại | Nội dung rút gọn | Chỗ giữ thông tin cũ |
|-------------------|------------------|----------------------|
| "Availability" | "Sẵn sàng" | Tooltip giải thích công thức |
| "MTTR (Bình quân)" | "MTTR" | Tooltip (Mean Time To Repair) |
| "MTBF (Trung bình)" | "MTBF" | Tooltip (Mean Time Between Failures) |
| "PM đúng hạn" | "Bảo trì" | Tooltip (% PM On-time) |
| "Chào mừng bạn quay lại MIRATS. Dưới đây là tóm tắt..." | (Xoá) | Không cần thiết |
| "Dữ liệu phân tích hiệu suất vận hành..." | (Xoá) | Page Header title đã đủ |

## 4. Phân tầng thị giác (3 Tầng)
- **Tầng 1 (Dải trên cùng)**: 4 KpiCards: Availability, MTTR, MTBF, PM.
- **Tầng 2 (Trung tâm)**: Sparklines lớn hơn cho xu hướng, HeartBeatStrip.
- **Tầng 3 (Chi tiết)**: LiveTimeline, Danh sách tài sản sức khỏe thấp (chuyển thành bảng tinh gọn).

## 5. Danh sách Sparkline & Nguồn dữ liệu
- **Availability**: Lấy từ `dashboard_su_co_by_month` (nghịch đảo downtime).
- **MTTR**: Chuỗi MTTR 6 tháng gần nhất từ RPC.
- **Dữ liệu hoàn thiện**: Lấy từ lịch sử snapshots (nếu có) hoặc 1 điểm tĩnh.

## 6. Lộ trình thực hiện
1. **Commit 1**: Tạo `KpiCard` component và `Sparkline` wrapper dùng Recharts.
2. **Commit 2**: Refactor `src/routes/_app.index.tsx` áp dụng component mới và tầng 1-2.
3. **Commit 3**: Refactor `src/routes/_app.tong-quan.tsx` để đồng bộ visual.
4. **Commit 4**: Tinh gọn Tầng 3 (Tables & Timeline) theo SnowUI style.

## 7. Danh sách kiểm tra (Parity Check)
- [ ] Mọi con số cũ vẫn hiện diện (giá trị logic không đổi).
- [ ] Tooltip hiển thị đầy đủ giải thích cho các nhãn viết tắt.
- [ ] Dark mode không bị chói ở các Card mới.
- [ ] Không có text < 11px.
