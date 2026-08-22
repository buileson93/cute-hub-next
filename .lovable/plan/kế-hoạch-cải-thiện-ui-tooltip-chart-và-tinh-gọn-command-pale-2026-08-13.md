# Kế hoạch Cải thiện UI Tooltip Chart và Tinh gọn Command Palette

Người dùng yêu cầu cải thiện khả năng hiển thị của thông tin khi hover (tooltip) trên các biểu đồ và tinh gọn Command Palette theo phong cách hiện đại (SnowUI/Figma style).

## Cải thiện Tooltip Chart

### 1. Nâng cấp `VisualKpiChart.tsx` & `StatusDonutChart.tsx`

- **Tăng độ tương phản**: Chuyển tooltip sang theme "High Contrast" (nền tối `hsl(var(--popover))` hoặc rất sáng, viền sắc nét).
- **Phông chữ và Khoảng cách**: Tăng nhẹ kích thước text tiêu đề trong tooltip, thêm `padding` rộng rãi hơn.
- **Giá trị nổi bật**: Hiển thị giá trị (value) với phông chữ lớn hơn và đậm hơn so với nhãn.
- **Dải màu (Indicator)**: Thêm một chấm màu hoặc dải màu bên cạnh giá trị để dễ đối chiếu với series trên biểu đồ.
- **Đổ bóng**: Thêm `box-shadow` mạnh hơn để tooltip "nổi" hẳn lên trên canvas biểu đồ.

## Tinh gọn Command Palette (`CommandPalette.tsx`)

Dựa trên phong cách Figma được cung cấp (tinh gọn, sạch sẽ, tập trung vào typography và khoảng trắng):

### 1. Cải thiện Cấu trúc & Layout

- **Giảm mật độ**: Tăng `gap` và `padding` giữa các item.
- **Typography**: Sử dụng font size chuẩn (13px/14px cho label, 11px cho shortcut/desc).
- **Icon**: Sử dụng icon mỏng hơn (stroke-width 1.5 hoặc 2) và màu sắc dịu hơn (`text-muted-foreground`).
- **Preview Panel**:
  - Tinh gọn khung preview bên phải: bỏ các border rườm rà.
  - Cải thiện hiển thị ảnh model: bo góc lớn hơn (12px), thêm shadow nhẹ.
  - Bố trí lại các MetaCell để trông chuyên nghiệp hơn.

### 2. Chi tiết Visual

- **Active State**: Sử dụng nền `bg-primary/5` hoặc `bg-accent` nhẹ nhàng cho item đang được chọn, thay vì các màu quá gắt.
- **Shortcut**: Làm cho các phím tắt (Kbd) trông tinh tế hơn (viền mờ, nền xám nhạt).
- **Group Headers**: Làm cho tiêu đề nhóm nhỏ hơn, chữ in hoa, `tracking-wider` để phân định rõ vùng tìm kiếm.

## Danh sách file sửa đổi

- `src/components/mirats/dashboard/VisualKpiChart.tsx`
- `src/components/mirats/dashboard/StatusDonutChart.tsx`
- `src/components/mirats/CommandPalette.tsx`
- `src/components/mirats/AppTooltip.tsx` (kiểm tra nếu cần sync style)
