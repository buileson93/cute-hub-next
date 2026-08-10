# Kế hoạch hoàn thiện MIRATS 2.0 (Giai đoạn tiếp theo)

## 1. Rà soát hiện trạng (Snapshot 10/08/2026)

Dựa trên việc quét mã nguồn và đối chiếu với kế hoạch MIRATS 2.0, các thành phần sau đang ở trạng thái **chưa hoàn thiện** hoặc **cần nâng cấp**:

| Vùng | Trạng thái thực tế | Vấn đề cần xử lý | Ưu tiên |
| --- | --- | --- | --- |
| **Nền tảng thị giác** | Đã có `StatusBadge`, `StatusRegistry` | Vẫn còn ~100+ nơi dùng màu Tailwind cứng; thiếu `PageHeader` ở 14 route; thiếu `EmptyState` ở 10 route. | 🔴 Cao |
| **Dashboard** | Trùng lặp widget giữa `/` và `/tong-quan` | Cả 2 trang đều có biểu đồ xu hướng và phân bổ; trang chủ chưa tập trung hoàn toàn vào "Việc cần làm". | 🔴 Cao |
| **Form Wizard** | Đã có `FormWizardSteps` và `ThietBiFormDialog` | `SuCoMoiForm`, `BaoTriMoiForm` vẫn là form phẳng dài (>15 trường); chưa áp dụng wizard 3 bước. | 🟠 Vừa |
| **Hàng đợi Offline** | Đã có logic `offline-queue.ts` | Chưa có `IndexedDBStorage` (vẫn dùng localStorage hạn chế); các route nghiệp vụ chưa gọi `enqueue`. | 🟠 Vừa |
| **Cây hệ thống** | File `_app.he-thong.cay.tsx` đã tách nhỏ | File vẫn khá lớn; chưa có Virtualization cho cây >2.000 node; chưa đồng bộ node vào URL. | 🟡 Thấp |

---

## 2. Kế hoạch triển khai cụ thể

### Bước 1: Chuẩn hóa Nền tảng thị giác (Giai đoạn 8 bổ sung)
*   **Mục tiêu**: Xóa bỏ hoàn toàn màu cứng, đảm bảo Dark Mode hoàn hảo.
*   **Hành động**:
    1.  Thay thế toàn bộ `ttColor`, `loaiColor` tại các trang chi tiết bằng `<StatusBadge domain="..." code="..." />`.
    2.  Bổ sung `PageHeader` cho các route admin và lịch sử phiếu.
    3.  Quét và thêm `aria-label` cho các nút icon trong `ActionBar` và `StandardTable`.

### Bước 2: Tái cấu trúc Dashboard & Action Center (Giai đoạn 12)
*   **Mục tiêu**: Phân vai rõ rệt "Hành động" vs "Phân tích".
*   **Hành động**:
    1.  **Trang chủ (`/`)**: Chuyển thành "Action Center". Đưa 5 dòng chỉ số (Sự cố khẩn, PM quá hạn, Đề xuất chờ duyệt) lên đầu. Chuyển toàn bộ biểu đồ Recharts sang trang `/tong-quan`.
    2.  **Trang Tổng quan (`/tong-quan`)**: Thêm các câu diễn giải ý nghĩa dưới mỗi biểu đồ (VD: "Sự cố tăng 20% do bão...").
    3.  **Hợp nhất KPI**: Dùng chung một nguồn dữ liệu từ `reliability.ts` và `bao-tri-kpi.ts`.

### Bước 3: Wizard hóa Form nghiệp vụ (Giai đoạn 15.3)
*   **Mục tiêu**: Giảm tải nhận thức khi khai báo hiện trường.
*   **Hành động**:
    1.  Refactor `SuCoMoiForm.tsx` dùng `FormWizardSteps` (3 bước: Thông tin chung -> Hình ảnh/Vật tư -> Xác nhận).
    2.  Tích hợp `CompletenessRing` vào header của các form để tạo động lực nhập liệu.
    3.  Thực hiện lưu nháp (Draft) vào `user_layout_prefs` tự động mỗi 1s.

### Bước 4: Kích hoạt hạ tầng Offline (Giai đoạn D)
*   **Mục tiêu**: Cho phép làm việc tại khu bay khi mất sóng.
*   **Hành động**:
    1.  Triển khai `IndexedDBStorage.ts` thực thụ thay thế cho bản mock hiện tại.
    2.  Nối nút "Lưu" ở `SuCoMoiForm` và `GopGach` vào `enqueue()` khi `navigator.onLine === false`.
    3.  Hiển thị `OfflineBadge` nổi bật khi có dữ liệu đang đợi đồng bộ.

---

## 3. Lộ trình hoàn thiện (Dự kiến 4 tuần)

1.  **Tuần 1**: Hoàn tất Nền tảng thị giác & PageHeader (Sạch nợ kỹ thuật UI).
2.  **Tuần 2**: Refactor 3 form nghiệp vụ chính sang Wizard (Tối ưu nhập liệu).
3.  **Tuần 3**: Hợp nhất Dashboard & Action Center (Tăng tính chỉ huy).
4.  **Tuần 4**: Triển khai Offline Storage & Kiểm thử hiện trường.
