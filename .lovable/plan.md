# Kế hoạch: Dashboard Hoàn thiện dữ liệu & Gamification (MIRATS 2.0)

Người dùng yêu cầu tạo trang Dashboard tổng quan để theo dõi độ hoàn thiện dữ liệu (%) theo thiết bị, module và danh sách tác vụ còn lại. Đây là bước tiếp theo trong lộ trình MIRATS 2.0 để nâng cao chất lượng dữ liệu thông qua cộng tác (Gamification).

## 1. Backend & Dữ liệu
- **Tạo Server Function `getCompletenessOverview`**:
  - Truy vấn danh sách thiết bị và hệ thống kỹ thuật.
  - Sử dụng logic `calculateCompleteness` (từ `src/lib/mirats/completeness.ts`) để tính toán % cho từng bản ghi.
  - Tổng hợp dữ liệu theo "Module" (Nhóm hệ thống).
  - Lấy danh sách nhiệm vụ từ `nhiem_vu_nhap_lieu` (trạng thái 'moi').
- **RPC `get_completeness_stats`**: Tạo một RPC trong PostgreSQL để tính toán nhanh các chỉ số tổng hợp (trung bình toàn hệ thống, số lượng thiết bị đạt 100%, số lượng thiết bị dưới 50%) để tối ưu hiệu năng Dashboard.

## 2. Giao diện (UI/UX)
- **Route mới `src/routes/_app.chat-luong-du-lieu.tsx`**:
  - Đặt tên tiếng Việt là "Chất lượng dữ liệu".
  - Hiển thị các Widget KPI: % Trung bình, Tổng số nhiệm vụ, Số người tham gia "Góp gạch".
  - **Biểu đồ Heatmap/Bar**: Hiển thị độ hoàn thiện theo Nhóm hệ thống (Module).
  - **Danh sách "Thiết bị cần quan tâm"**: Top các thiết bị quan trọng nhưng độ hoàn thiện thấp.
  - **Widget "Nhiệm vụ sắp tới"**: Hiển thị các tác vụ 'Góp gạch' còn lại.
- **Tích hợp vào `AppShell`**: Cập nhật `src/lib/mirats/nav-contract.ts` để thêm menu này vào không gian làm việc "Vận hành" hoặc "Quản trị hệ thống".
- **Cập nhật `Action Center` (Trang chủ `/`)**: Thêm một card tóm tắt "Tiến độ làm sạch dữ liệu" để kích thích người dùng tham gia.

## 3. Các bước thực hiện
1. **Migration**: Thêm cột `completeness_pct` vào bảng `thiet_bi` và `he_thong` (tùy chọn để tối ưu query) hoặc tạo View `v_completeness`.
2. **Server Logic**: Triển khai `completeness.functions.ts` để nạp dữ liệu cho Dashboard.
3. **UI Components**:
   - Tạo `CompletenessStats.tsx`: Hiển thị các con số tổng quát.
   - Tạo `ModuleCompletenessChart.tsx`: Biểu đồ phân bổ theo nhóm.
   - Tạo `TaskListView.tsx`: Danh sách tác vụ còn lại.
4. **Integration**: Đăng ký route và menu.
5. **Verification**: Kiểm tra logic tính toán khớp với các trường CORE_FIELDS đã định nghĩa.

Bạn có đồng ý với kế hoạch tạo trang Dashboard chuyên biệt cho chất lượng dữ liệu này không?
