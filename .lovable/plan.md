# Sổ lý lịch hệ thống — bố cục thông minh, có HP + biểu đồ

## Mục tiêu
Tinh gọn trang `/_app/he-thong/$id` theo bố cục 3 vùng dễ đọc, thêm điểm sức khỏe hệ thống (HP) trực quan và vài biểu đồ nhỏ để nhìn ra "sức khỏe – nhịp vận hành" ngay ở đầu trang.

## Bố cục mới

```text
┌──────────────────────────────────────────────────────────────┐
│  HEADER  Tên HT · Đơn vị · Mã Bravo · Badge GPKT             │
│  ─────────────────────────────────────────────────────────    │
│  HP BAR  ████████████░░░░  82/100  Tốt                        │
│          Uptime · MTBF · Sự cố 30d · Bảo dưỡng đúng hạn       │
└──────────────────────────────────────────────────────────────┘

┌──── KPI (5 thẻ, click chuyển menu tương ứng) ───────────────┐
│ Tài sản · Bảo dưỡng · Sự cố · Thay thế · Bàn giao            │
└──────────────────────────────────────────────────────────────┘

┌── CỘT TRÁI (1/3) ────────┐  ┌── CỘT PHẢI (2/3) ─────────────┐
│ Định danh & chỉ số        │  │ Chart row (3 biểu đồ nhỏ)      │
│  – Đơn vị / Bravo / GPKT  │  │  · Sự cố 12 tháng (bar)        │
│  – MTBF · MTTR · Ngày     │  │  · Tỷ lệ trạng thái tài sản    │
│    không sự cố · Uptime   │  │    (donut)                     │
│                           │  │  · Xu hướng bảo dưỡng (line)   │
│ Thành phần hệ thống       │  ├────────────────────────────────┤
│ (card hiện có)            │  │ Nhật ký khai thác (Tabs)       │
│                           │  │  Timeline · Thành phần · BT ·   │
│                           │  │  SC · Thay · Bàn giao · Liên kết│
└──────────────────────────┘  └────────────────────────────────┘
```

## Thanh HP (sức khỏe hệ thống)

Thanh ngang gradient (đỏ → vàng → xanh) hiển thị điểm 0–100 kèm nhãn:
`≥85 Tốt · 60–84 Ổn · 40–59 Cảnh báo · <40 Yếu`.

Công thức (frontend, từ dữ liệu đã có):
- `+40` nếu còn GPKT hiệu lực, `+20` nếu sắp hết (≤90 ngày), `0` nếu hết/không có.
- `+25` khi 30 ngày qua không có sự cố `dang_xu_ly`; trừ dần theo số sự cố mở.
- `+20` nếu ≥80% tài sản con ở trạng thái hoạt động; scale theo tỷ lệ.
- `+15` nếu có bảo dưỡng trong 90 ngày qua; scale theo độ trễ.
Kèm 4 chỉ số phụ dạng chip: Uptime%, MTBF, Sự cố 30d, Bảo dưỡng đúng hạn.

Hover chip → tooltip giải thích công thức. Click chip Sự cố/Bảo dưỡng → chuyển tab tương ứng.

## Biểu đồ (recharts – đã có trong dự án)

1. **Sự cố theo tháng (12 tháng)** – BarChart nhỏ, tô đỏ khi > ngưỡng TB.
2. **Trạng thái tài sản con** – Donut (hoạt động / bảo trì / hỏng / khác), click lát cắt → lọc Tab Thành phần.
3. **Nhịp bảo dưỡng vs sự cố** – LineChart 2 chuỗi 6 tháng gần nhất.

Tất cả `<ResponsiveContainer>` cao 120–140px, không trục rườm rà, chỉ tooltip.

## Tương tác

- KPI card & chip HP → `Link` sang menu Tài sản/Sự cố/Bảo trì/Giấy phép có filter theo hệ thống.
- Hover HP bar → popover chi tiết công thức + điểm cộng/trừ.
- Sticky header (HP bar + tên HT) khi cuộn xuống Nhật ký để luôn thấy sức khỏe.
- Tabs Nhật ký giữ nguyên, thêm badge count đã có.

## Chi tiết kỹ thuật

- File duy nhất cần sửa: `src/routes/_app.he-thong.$id.tsx`.
- Tách 3 component phụ nội bộ: `HealthBar`, `MiniCharts`, `HeaderSticky` (cùng file để tránh phình thư mục).
- Dữ liệu: dùng lại `ops.baoTri/suCo/hongHoc/banGiao` + `devices` đã có, không thêm query.
- Recharts import từ `recharts` (đã dùng ở Dashboard) — không thêm dependency.
- Responsive: mobile stack dọc (HP bar full-width, charts cuộn ngang trong 1 grid `grid-cols-1 sm:grid-cols-3`).
- Semantic tokens (`--primary`, `--muted`, `--destructive`) — không hardcode màu, gradient HP dùng `from-red-500 via-amber-400 to-emerald-500` (tailwind utility, đồng bộ với các badge trạng thái hiện tại).

## Ngoài phạm vi
- Không đổi schema DB, không thêm RPC.
- Không đổi các Tab hiện có bên trong Nhật ký khai thác.
- Không đụng trang cây hệ thống / danh sách hệ thống.
