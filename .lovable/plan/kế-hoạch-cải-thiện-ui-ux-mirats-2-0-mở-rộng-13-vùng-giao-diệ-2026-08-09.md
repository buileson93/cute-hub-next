# Kế hoạch Cải thiện UI/UX MIRATS 2.0 — Mở rộng 13 vùng Giao diện

Dựa trên bản rà soát toàn diện 105 route và 150.000+ dòng code, kế hoạch này mở rộng phạm vi từ "Quản lý thiết bị" sang toàn bộ hệ thống MIRATS để giải quyết triệt để tình trạng "ngợp dữ liệu" và thiếu nhất quán.

## 0. Trạng thái hiện tại

- **Thiết bị (GĐ 1-4)**: Đã hoàn thành tái cấu trúc trang chi tiết, hệ thống View Preset, KPI Bar và Health Indicators. Điểm đánh giá vùng này tăng từ 4/10 lên 8.5/10.
- **13 vùng còn lại**: Điểm trung bình ≈ 4.1/10. Đặc biệt là Thành phần hệ thống (56 cột) và Cây hệ thống (6.165 dòng) đang ở mức 3/10.

---

## LỘ TRÌNH TRIỂN KHAI (Giai đoạn 8 — 14)

### Giai đoạn 8: Nền tảng thị giác dùng chung (Ưu tiên Cao nhất)

_Mục tiêu: Xoá bỏ 579 vị trí màu hardcode, hỗ trợ Dark Mode hoàn chỉnh và nhất quán trạng thái._

- **8.1 Status Registry**: Mở rộng `src/lib/mirats/ui/status-tokens.ts` cho mọi loại danh mục (Bảo trì, Sự cố, Kết quả, Cấp phát).
- **8.2 StatusBadge Component**: Tạo component dùng chung, thay thế toàn bộ logic `color-mapping` thủ công trong các Drawer/Table.
- **8.3 Standard UI Shell**:
  - Áp dụng `PageHeader` cho 43 route còn thiếu (Breadcrumb + Title).
  - Chuẩn hoá `EmptyState`, `TableSkeleton`, `ErrorState` vào `StandardTable`.
- **8.4 Accessibility (a11y)**: Bổ sung `aria-label` cho 51 nút icon và kiểm tra tương phản màu.

### Giai đoạn 9: Thành phần hệ thống (56 cột → 8 cột)

_Mục tiêu: Tối ưu hoá bảng nặng nhất hệ thống._

- **9.1 Analysis**: Chạy script đo tỷ lệ điền dữ liệu cho bảng `he_thong_thanh_phan`.
- **9.2 View Presets**: Triển khai bộ Preset (Cơ bản, Kỹ thuật, Tương thích) giống như đã làm với Thiết bị.
- **9.3 Row Expand**: Chuyển các trường đặc tính động (từ `v_thiet_bi_dac_tinh`) sang panel mở rộng thay vì để cột.
- **9.4 Refactor**: Tách file `ThanhPhanTable.tsx` (>1.200 dòng) thành các sub-components.

### Giai đoạn 10: Cây hệ thống (Tách file 6.165 dòng)

_Mục tiêu: Giải cứu file trung tâm của dự án._

- **10.1 Tab Consolidation**: Gom 12 tab hiện tại về 4 nhóm nghiệp vụ chính.
- **10.2 Component Splitting**: Tách thành `TreeNodeRow.tsx`, `TreeToolbar.tsx`, `TreeFilters.tsx`, `useTreeData.ts`.
- **10.3 Performance**: Áp dụng `@tanstack/react-virtual` và Lazy Load cho các node cấp sâu.
- **10.4 Navigation**: Đồng bộ node đang chọn vào URL để hỗ trợ chia sẻ liên kết trực tiếp.

### Giai đoạn 11: Vòng đời & Tuân thủ

_Mục tiêu: Nhất quán 5 trang Kiểm định, Tuổi thọ, Giấy phép, Bàn giao, Vật tư._

- **11.1 Lifecycle Pattern**: Sử dụng chung một khuôn `<VongDoiListPage>` với dải KPI lọc và thanh đếm ngược hạn dùng.
- **11.2 Alert Center**: Hợp nhất trang "Sắp hết hạn" thành trung tâm cảnh báo tập trung (Cross-domain alerts).

### Giai đoạn 12: Hợp nhất Dashboard

_Mục tiêu: Xử lý sự trùng lặp giữa Dashboard (Home) và Trang tổng quan._

- **12.1 Role Separation**: Trang chủ (Index) tập trung vào "Việc cần làm ngay"; Trang tổng quan tập trung vào "Xu hướng dài hạn".
- **12.2 Drill-down Fix**: Chuyển các biểu đồ Heatmap về trang Tổng quan, thay thế bằng các câu trả lời trực tiếp từ dữ liệu ở Trang chủ.

### Giai đoạn 13: Chi tiết bản ghi & Form nhập nhanh

_Mục tiêu: Đơn giản hoá các form >800 dòng và chuẩn hoá layout._

- **13.1 Record Layout**: Nhất quán bố cục (Tóm tắt → Diễn tiến → Hồ sơ) cho Sự cố/Bảo trì/Hỏng hóc.
- **13.2 Form Wizard**: Chuyển các form nhập nhanh sang 3 bước (Bắt buộc → Chi tiết → Xác nhận).
- **13.3 Dialog Standard**: Chuẩn hoá 3 kích cỡ Dialog (sm, md, lg) thay vì 12 giá trị `max-w` khác nhau.

### Giai đoạn 14: Hiện trường & Điều hướng

- **14.1 Responsive Table**: Tự động chuyển sang Mobile Card View cho các màn hình < 768px.
- **14.2 QR Màn hiện trường**: Tối ưu nút bấm lớn và thao tác một tay cho trang quét mã QR.
- **14.3 Shell Refactor**: Tách `AppShell` và `CommandPalette` để dễ bảo trì.

---

## HÀNH ĐỘNG CẬN VỆ (Rà soát Codebase trước khi chốt)

1. **[X] Kiểm tra file lớn**: Đã xác nhận `ThanhPhanTable` (60KB), `HeThongCay` (290KB) và `PhanQuyen` (30KB).
2. **[X] Kiểm tra màu cứng**: Xác nhận ~484 vị trí `bg-` màu cứng thiếu Dark mode.
3. **[ ] Xác minh N10 (Commit strategy)**: Phải chia nhỏ các đợt sửa màu (15 file/lần) để tránh xung đột merge.
4. **[ ] Xác minh N11 (Test coverage)**: Mở rộng `ui-consistency-guard.test.ts` để quét cả thư mục `src/components/mirats/**` trước khi tách file.
5. **[ ] Xác minh N13 (URL Map)**: Lập bảng ánh xạ Tab cũ → Tab mới cho Cây hệ thống (12 → 4).

Tôi sẽ bắt đầu triển khai **Giai đoạn 8** (Nền tảng thị giác) đầu tiên vì nó ảnh hưởng đến mọi giai đoạn sau.
