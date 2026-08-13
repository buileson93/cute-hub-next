# Kế hoạch Tinh chỉnh Giao diện MIRATS 2.0 (Giai đoạn Dashboard & Shell)

Kế hoạch này tập trung vào việc hiện đại hóa giao diện Dashboard chính (`/`) và trang Tổng quan KPI (`/tong-quan`) theo phong cách Apple-like, tối giản, chuyên nghiệp và tối ưu hóa trải nghiệm người dùng (UX) dựa trên prototype.

## Phân tích hiện trạng
- **Dashboard chính (`/`):** Đã có một số cải tiến về typography (IBM Plex Mono, Space Grotesk) nhưng bố cục vẫn còn nhiều khoảng trắng chưa tối ưu, các khối chức năng (`Operations Hub`, `Fleet Analytics`) chưa thực sự gắn kết.
- **Tổng quan KPI (`/tong-quan`):** Vẫn sử dụng nhiều Card rời rạc, màu sắc có phần rực rỡ (oklch palette đã áp dụng nhưng cần tinh chỉnh thêm về sắc độ để tạo chiều sâu).
- **App Shell:** Sidebar và Rail hoạt động ổn định nhưng phần "Nhịp tim hệ thống" (HeartBeatStrip) cần được tích hợp mượt mà hơn vào header hoặc một vị trí cố định thay vì nằm lưng chừng.

## Các giai đoạn triển khai

### Phase 1: Tinh chỉnh App Shell & Navigation (Nền tảng)
- **Header Unified:** Hợp nhất thanh TopBar và dải "Nhịp tim" thành một khối thống nhất. Nhịp tim sẽ được hiển thị dưới dạng các chấm LED nhỏ, tinh tế hơn trong header.
- **Sidebar & Rail:** Cập nhật hiệu ứng hover và active theo phong cách kính mờ (glassmorphism). Thu gọn khoảng cách các item để tăng mật độ thông tin mà không gây rối mắt.
- **UI Density:** Áp dụng chặt chẽ `UI_DENSITY` đã định nghĩa, đảm bảo padding `p-4 md:p-6` và gap `gap-4` nhất quán toàn hệ thống.

### Phase 2: Tái cấu trúc Dashboard Chính (`src/routes/_app.index.tsx`)
- **Hero Metrics:** Thay thế dải metric hiện tại bằng một bảng điều khiển trung tâm (Command Center) hiển thị Availability, MTTR, MTBF với biểu đồ sparkline nhỏ đi kèm.
- **Visual Hierarchy:**
  - Ưu tiên "Brief hôm nay" lên vị trí cao nhất.
  - Sử dụng `Bento Grid` để sắp xếp các khối: Health Status, Incident Trend, và Data Quality.
- **Fleet Attention List:** Chuyển từ dạng bảng truyền thống sang dạng danh sách các thẻ (List Cards) có phân loại màu LED rõ ràng (A/B/C/D).

### Phase 3: Hiện đại hóa Tổng quan KPI (`src/routes/_app.tong-quan.tsx`)
- **Metric Cards:** Loại bỏ các CardTitle dài dòng, thay bằng icon + nhãn ngắn + Tooltip (đã bắt đầu nhưng cần hoàn thiện 100%).
- **Charts:**
  - Đồng bộ hóa màu sắc biểu đồ Recharts với hệ màu Brand Blue (#1D52E0).
  - Sử dụng Area Chart thay vì Bar Chart cho xu hướng để tạo cảm giác mượt mà.
  - Mặc định ẩn Legend nếu không cần thiết để tăng diện tích hiển thị dữ liệu.

### Phase 4: Tối ưu hóa Trải nghiệm Di động (Mobile UX)
- **Mobile Nav:** Tối ưu thanh điều hướng dưới cùng (MobileNav), đảm bảo các icon đủ lớn và có nhãn rõ ràng.
- **Responsive Layout:** Đảm bảo các biểu đồ tự động chuyển sang dạng tối giản hoặc ẩn bớt các cột không cần thiết trên màn hình nhỏ.

## Chi tiết kỹ thuật (Technical Details)
- **Framework:** TanStack Start v1, React 19.
- **Styling:** Tailwind CSS v4 (sử dụng oklch cho màu sắc động).
- **Components:** Shadcn/ui (tinh chỉnh CSS variables trong `src/styles.css`).
- **Data Fetching:** TanStack Query (`useQuery`) kết hợp với Server Functions để đảm bảo hiệu năng.
- **Typography:** 
  - `Space Grotesk`: Tiêu đề, số liệu lớn.
  - `IBM Plex Mono`: Số liệu kỹ thuật, mã thiết bị.
  - `Inter`: Văn bản nội dung.

## Bước tiếp theo
Tôi sẽ bắt đầu triển khai **Phase 1** bằng cách cập nhật `AppShell` và `HeartBeatStrip` để tạo ra một khung nhìn chuyên nghiệp hơn.
