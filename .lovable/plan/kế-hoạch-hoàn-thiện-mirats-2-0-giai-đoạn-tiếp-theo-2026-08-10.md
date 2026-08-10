# Kế hoạch hoàn thiện MIRATS 2.0 (Giai đoạn tiếp theo)

## 1. Rà soát hiện trạng (Snapshot 10/08/2026)

Dựa trên việc quét mã nguồn và đối chiếu với kế hoạch MIRATS 2.0, các thành phần sau đang ở trạng thái **chưa hoàn thiện** hoặc **cần nâng cấp**:

| Vùng | Trạng thái thực tế | Vấn đề cần xử lý | Ưu tiên |
| --- | --- | --- | --- |
| **Nền tảng thị giác** | Đã có `StatusBadge`, `StatusRegistry` | Vẫn còn ~100+ nơi dùng màu Tailwind cứng; thiếu `PageHeader` ở 14 route; thiếu `EmptyState` ở 10 route. | 🔴 Cao |
| **Dashboard** | Đã tách Action Center & Analytics | Cần hoàn thiện các diễn giải biểu đồ tại `/tong-quan` và kiểm tra tính nhất quán dữ liệu giữa các nguồn. | 🟠 Vừa |
| **Form Wizard** | Đã có `FormWizardSteps` | `SuCoMoiForm`, `BaoTriMoiForm` đã được refactor sơ bộ nhưng cần tích hợp `CompletenessRing` và logic lưu nháp (Draft). | 🟠 Vừa |
| **Hàng đợi Offline** | Đã có `IndexedDBStorage.ts` | Các route nghiệp vụ (`/su-co`, `/bao-tri`) chưa gọi `enqueue`; chưa có `OfflineBadge` hiển thị trạng thái đồng bộ. | 🔴 Cao |
| **Cây hệ thống** | Đã tách component | Cần Virtualization cho cây lớn (>2.000 node) và đồng bộ trạng thái node vào URL search params. | 🟡 Thấp |

---

## 2. Kế hoạch triển khai cụ thể

### Bước 1: Chuẩn hóa Nền tảng thị giác (Giai đoạn 8 bổ sung)
*   **Mục tiêu**: Xóa bỏ hoàn toàn màu cứng, đảm bảo Dark Mode hoàn hảo.
*   **Hành động**:
    1.  Thay thế toàn bộ `ttColor`, `loaiColor` tại các trang danh sách và chi tiết còn lại bằng `<StatusBadge domain="..." code="..." />`.
    2.  Bổ sung `PageHeader` cho các route admin (`/admin/*`) và các trang lịch sử.
    3.  Quét và thêm `aria-label` cho các nút icon trong `ActionBar` và `StandardTable` để hỗ trợ accessibility.

### Bước 2: Tối ưu Dashboard & Action Center (Hoàn thiện Giai đoạn 12)
*   **Mục tiêu**: Tăng tính diễn giải và nhất quán dữ liệu.
*   **Hành động**:
    1.  **Trang Tổng quan (`/tong-quan`)**: Hoàn thiện việc thêm các câu diễn giải ý nghĩa dưới mỗi biểu đồ còn lại (Top hệ thống, Heatmap).
    2.  **Hợp nhất KPI**: Rà soát để đảm bảo dữ liệu từ `reliability.ts` và `bao-tri-kpi.ts` đồng bộ với các RPC backend.

### Bước 3: Hoàn thiện Wizard & Động lực nhập liệu (Giai đoạn 15.3)
*   **Mục tiêu**: Giảm tải nhận thức và tăng chất lượng dữ liệu.
*   **Hành động**:
    1.  Tích hợp `CompletenessRing` vào header của các Form Wizard (`SuCoMoiForm`, `ThietBiFormDialog`) để người dùng thấy ngay hiệu quả của việc nhập đầy đủ thông tin.
    2.  Triển khai logic lưu nháp (Draft) vào `user_layout_prefs` hoặc IndexedDB tự động mỗi 5s để tránh mất dữ liệu khi trình duyệt crash.

### Bước 4: Kích hoạt hạ tầng Offline thực thụ (Giai đoạn D)
*   **Mục tiêu**: Làm việc tin cậy tại hiện trường (khu bay, nhà trạm) khi sóng yếu.
*   **Hành động**:
    1.  Thay thế hoàn toàn bộ nhớ đệm tạm thời bằng `IndexedDBStorage.ts`.
    2.  Nối logic `enqueue()` vào các form nghiệp vụ chính khi phát hiện `navigator.onLine === false`.
    3.  Tạo component `OfflineStatusBanner` hiển thị số lượng bản ghi đang đợi đồng bộ.

---

## 3. Lộ trình hoàn thiện (Dự kiến 4 tuần)

1.  **Tuần 1**: Hoàn tất Nền tảng thị giác & PageHeader (Sạch nợ kỹ thuật UI).
2.  **Tuần 2**: Tích hợp Completeness & Auto-save vào các Form Wizard.
3.  **Tuần 3**: Kích hoạt Offline Storage & hiển thị trạng thái đồng bộ.
4.  **Tuần 4**: Virtualization Cây hệ thống & Kiểm thử tổng thể hiện trường.
