# Kế hoạch Tinh chỉnh Giao diện MIRATS 2.0 (Prototype-Driven)

Dựa trên prototype ByeWind (CleanShot), tôi đề xuất kế hoạch tinh chỉnh để đạt được giao diện **Professional Minimalism**: nền trắng tinh khiết, các khối card mềm mại với đổ bóng nhẹ, font chữ đơn sắc, và chỉ sử dụng màu Accent (Xanh brand) cho các điểm nhấn quan trọng.

## Đánh giá & Tiêu chí thiết kế
- **Bảng màu:** Loại bỏ các màu xanh lá/cam/đỏ quá đậm ở background. Dùng nền trắng (`#FFFFFF`) và xám cực nhẹ (`#F7F9FB`) cho card.
- **Typography:** Ưu tiên font Sans-serif sạch sẽ (Inter/SF Pro) cho UI, chỉ dùng Mono cho số liệu kỹ thuật.
- **Layout:** Sử dụng Bento Grid với khoảng cách (gap) lớn hơn, bo góc mạnh (`1.5rem` - `2rem`).
- **Accent:** Chỉ dùng xanh Blue (#1D52E0) cho các chỉ số quan trọng và trạng thái Active.

## Các giai đoạn thực hiện

### Giai đoạn 1: Hệ thống Design Tokens & Shell
- **src/styles.css:** Cập nhật biến `oklch` để đưa background về trắng tinh khiết, giảm độ đậm của `muted` và `border`.
- **Sidebar & TopBar:** 
  - Chuyển Sidebar sang màu xám cực nhẹ hoặc trắng, loại bỏ border chia cắt mạnh.
  - Sidebar item: Chỉ hiện icon + label khi hover hoặc mở rộng, bo góc `12px`.
  - TopBar: Tối giản hóa Search input (viền bo tròn hoàn toàn, nền nhạt).

### Giai đoạn 2: Dashboard Overview (Clean Layout)
- **Metric Cards:** Thiết kế lại 4 chỉ số trên cùng (Availability, MTTR, MTBF, PM) theo phong cách prototype:
  - Nền card xanh nhạt/trắng, text to đậm, có sparkline nhỏ bên cạnh.
- **Biểu đồ (Charts):**
  - Chuyển Area Chart sang dạng nét mảnh, gradient mờ.
  - Pie Chart (Sức khỏe): Dùng donut chart mảnh hơn, chú thích (legend) đặt bên phải như prototype.
- **Fleet Attention List:** Chuyển từ bảng truyền thống sang danh sách các hàng (Rows) tối giản, không viền dọc.

### Giai đoạn 3: Right Sidebar (Notification & Activity Feed)
- Xây dựng dải Feed bên phải (tương tự prototype) để hiển thị "Thông báo" và "Hoạt động gần đây" thay vì để chúng trong Dropdown.

### Giai đoạn 4: Mobile & Dark Mode Consistency
- Đảm bảo các thay đổi không phá vỡ giao diện trên điện thoại.
- Điều chỉnh Dark Mode để duy trì độ tương phản thấp (soft dark), tránh đen tuyền.

## Danh sách tệp sẽ thay đổi
- `src/styles.css`: Cấu hình màu sắc và bóng đổ.
- `src/components/mirats/app-shell/AppShell.tsx`: Cấu trúc Layout 3 cột (Sidebar - Main - Feed).
- `src/routes/_app.index.tsx`: Tái cấu trúc Dashboard theo Bento Grid.
- `src/components/mirats/dashboard/HeartBeatHeader.tsx`: Thu nhỏ hơn nữa để tích hợp vào TopBar.
