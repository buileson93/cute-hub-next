# Giai đoạn 1: Khảo sát và Đề xuất hợp nhất 12 Component Huy hiệu

Dưới đây là bảng thống kê và phân loại 12 component huy hiệu hiện có trong hệ thống MIRATS.

## Bảng khảo sát (Giai đoạn 1)

| Tên File | Lượt dùng | Có test? | Ý nghĩa nghiệp vụ | Đề xuất hợp nhất | Lý do |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **AnomalyBadge.tsx** | 9 | ✅ | Hiển thị z-score sự cố bất thường (90 ngày). | **GIỮ RIÊNG** | Có logic nghiệp vụ đặc thù (z-score) và đã có test. |
| **AutoFilledBadge.tsx** | 5 | ✅ | Chỉ dấu "auto" đi kèm nút Undo cho form. | **GIỮ RIÊNG** | Có logic interaction (Undo) đặc thù và đã có test. |
| **MauChip.tsx** | 25 | ✅ | Hiển thị chip màu cho Chủng loại/Nhãn tài sản. | **GIỮ RIÊNG** | Gắn liền với hệ thống màu `BANG_MAU` và đã có test. |
| **StatusBadge.tsx** | 56 | ❌ | Huy hiệu trạng thái chính (Hệ thống, Thiết bị). | **GỐC (BASE)** | Đây là component trung tâm sẽ nhận thêm các loại trạng thái khác. |
| **CodeBadge.tsx** | 18 | ❌ | Hiển thị mã định danh (Monospace, Icon #). | **Badge (variant)** | Có thể chuyển thành một variant của `Badge` chuẩn hoặc prop trong `CodeBadge` dùng `Badge`. |
| **ExpiringBadge.tsx** | 14 | ❌ | Cảnh báo hạn (theo số ngày còn lại). | **StatusBadge** | Có thể tích hợp vào `StatusBadge` vì bản chất là một loại trạng thái có màu theo ngưỡng. |
| **MultiRoleBadge.tsx** | 5 | ❌ | Tài sản đa vai trò (có HoverCard danh sách). | **GIỮ RIÊNG** | Có cấu trúc UI phức tạp (HoverCard, Link, logic đa vai trò). |
| **OfflineBadge.tsx** | 2 | ❌ | Trạng thái đồng bộ Offline/Online. | **StatusBadge** | Có thể coi là trạng thái kết nối của ứng dụng, hợp nhất vào hệ thống trạng thái. |
| **ReadOnlyBadge.tsx** | 4 | ❌ | Chỉ dấu "Chỉ đọc" cho khu vực không có quyền. | **Badge (variant)** | Chuyển thành variant `outline` với icon `Eye`, dùng `Badge` chuẩn. |
| **OcrStatusBadge.tsx** | 6 | ❌ | Trạng thái xử lý OCR (thất bại, chờ, xong). | **StatusBadge** | Là trạng thái quy trình, hoàn toàn có thể dùng `StatusBadge` với domain `ocr`. |
| **DeltaBadge.tsx** | 5 | ❌ | So sánh % tăng giảm so với kỳ trước. | **GIỮ RIÊNG** | Không phải là huy hiệu trạng thái, mà là chỉ số thống kê (có logic tính % và mũi tên). |
| **StatusDot.tsx** | 8 | ❌ | Chấm màu trạng thái (dùng trong Dashboard). | **StatusBadge** | Tích hợp thành một mode hiển thị `dot-only` của `StatusBadge`. |

## Phân loại rút gọn (Kỳ vọng)

Sau khi hợp nhất, chúng ta sẽ chỉ còn các nhóm chính:

1.  **Hệ thống StatusBadge (Hợp nhất)**:
    *   Tiếp nhận: `ExpiringBadge`, `OfflineBadge`, `OcrStatusBadge`, `StatusDot`.
    *   Hỗ trợ domain động và mode hiển thị (Badge hoặc Dot).

2.  **Hệ thống Badge chuẩn (shadcn/ui)**:
    *   Tiếp nhận: `CodeBadge`, `ReadOnlyBadge` thông qua các variant hoặc utility classes.

3.  **Huy hiệu Nghiệp vụ đặc thù (Giữ lại do có Test/Logic phức tạp)**:
    *   `AnomalyBadge` (Logic z-score).
    *   `AutoFilledBadge` (Logic Undo).
    *   `MauChip` (Hệ thống màu Token).
    *   `MultiRoleBadge` (UI HoverCard phức tạp).
    *   `DeltaBadge` (Chỉ số so sánh).

## Ghi chú quan trọng
*   3 component có test (`AnomalyBadge`, `AutoFilledBadge`, `MauChip`) được giữ nguyên để đảm bảo không phá vỡ hợp đồng dữ liệu hiện tại.
*   `StatusBadge` sẽ được mở rộng để xử lý các "domain" mới như `ocr`, `connectivity`, `expiry`.

**Tôi đã hoàn thành Giai đoạn 1. Chờ xác nhận để chuyển sang Giai đoạn 2 (Thực thi).**
