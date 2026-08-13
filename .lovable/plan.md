# Kế hoạch tinh gọn giao diện (Compact UI Refinement)

Bối cảnh: Tăng mật độ thông tin, đưa các thành phần Card, KPI và Bảng về giao diện chuyên nghiệp, hiện đại (Apple-like/SnowUI) bằng cách chuẩn hóa các token mật độ.

## 1. Kiểm toán hiện trạng và Mục tiêu

| Thành phần | Hiện tại (Compact) | Mục tiêu |
| :--- | :--- | :--- |
| **KPI Card** | h-auto (~110px), p-3, rounded-xl (10px) | h-[104px], p-4, rounded-[16px] |
| **Content Card** | p-3 (md:p-4), rounded-xl (10px) | p-4, rounded-[16px], header 14px |
| **Bảng (Dòng)** | h-9 (36px), py-1.5 (6px) | h-9 (36px), py-1.5 (6px) - Giữ nguyên |
| **Bảng (Header)** | bg-muted, text-sm | Sticky, faded color, text 12px |
| **Biểu đồ** | h-[280px] | h-[220px] |

## 2. Chiến lược triển khai qua Token (ui-density.ts)

Thay vì sửa từng file, ta sẽ cập nhật `UI_DENSITY` và `Card` component để áp dụng đồng loạt.

### Bước 1: Cập nhật `src/lib/mirats/ui/ui-density.ts`
*   `CARD_RADIUS`: "rounded-[16px]"
*   `CARD_PADDING`: "p-4"
*   `KPI_VALUE_FS`: "text-[22px]"
*   `KPI_LABEL_FS`: "text-[13px]"
*   `TABLE_HEADER_FS`: "text-[12px]"
*   `CHART_H`: "h-[220px]"

### Bước 2: Chuẩn hóa `src/components/ui/card.tsx`
*   Áp dụng `UI_DENSITY.CARD_RADIUS` và `UI_DENSITY.CARD_PADDING` vào component gốc.
*   Cập nhật `CardTitle` mặc định về `text-sm font-semibold`.

### Bước 3: Tinh chỉnh `StandardTable.tsx`
*   **Header**: Thay đổi class `TableHeader` để có màu chữ mờ hơn và size 12px.
*   **Bố cục**: Bỏ `striping` (zebra) nếu bảng đã có `border-b`.
*   **Chiều cao**: Kiểm tra `TABLE_MAX_H` để đảm bảo vùng cuộn chừa tối đa 12rem (đã có token).

### Bước 4: Khôi phục logic KPI Card tại `_app.tong-quan.tsx`
*   Sửa `KpiCard` và `HealthTile` để số liệu và biến động (trend) nằm trên cùng một hàng.
*   Áp dụng màu nền nhạt luân phiên (emerald-50, amber-50, red-50, etc.) thay vì border/shadow nặng.

## 3. Danh sách file và thay đổi dự kiến

1.  `src/lib/mirats/ui/ui-density.ts`: Thêm/sửa các token kích thước mới.
2.  `src/components/ui/card.tsx`: Đồng bộ padding và border-radius.
3.  `src/components/mirats/StandardTable.tsx`: Sửa style Header và Row.
4.  `src/routes/_app.tong-quan.tsx`: Refactor layout `KpiCard` và `HealthTile`.
5.  `src/styles.css`: Loại bỏ các override `data-density="compact"` thủ công gây xung đột với token mới.

## 4. Kiểm tra và Đảm bảo (Parity Check)

*   **Virtualizer**: Đảm bảo `estimateSize` trong `StandardTable` khớp với `TABLE_ROW_H` (36px).
*   **Tiếng Việt**: Kiểm tra các nhãn dài (ví dụ: "Sắp hết hạn trong 30 ngày") không bị cắt mất chữ quan trọng khi giảm padding.
*   **Mật độ dòng**: Tại màn hình 1440x900, số dòng bảng hiển thị dự kiến tăng từ ~12 dòng lên ~15-16 dòng.

---
*Lưu ý: Không thay đổi logic nghiệp vụ, chỉ điều chỉnh lớp trình diễn UI.*
