# Audit Design System Astryx (Giai đoạn 0)

## 1. Bảng số liệu kỹ thuật

| Chỉ số | Kết quả | Ghi chú |
| :--- | :--- | :--- |
| **Typography `text-[...px]`** | 860+ lần | Chủ yếu là 10px (350) và 11px (358). Cần chuẩn hoá về 6 bậc Astryx. |
| **Mã Hex trong .tsx** | 97 | Rải rác trong các icon, chart và inline style. |
| **Class màu Palette (sky/amber/...)** | 575 | Vi phạm hợp đồng "chỉ dùng semantic token". |
| **Inline `style={{ }}`** | 99 | Chủ yếu ở các component biểu đồ và sơ đồ. |
| **Overlays (Dialog/Sheet/Drawer/Resp)** | 164 | Cần hợp nhất về 1 cơ chế Overlay duy nhất theo Astryx. |
| **Tables (Standard/Catalog/ThanhPhan)** | 54 | 42 file dùng StandardTable - là đối tượng refactor chính. |

## 2. Top 10 File UI "Nợ kỹ thuật" cao nhất

| File | Lý do |
| :--- | :--- |
| `StandardTable.tsx` | 1653 dòng. Logic xử lý bảng quá cồng kềnh, trộn lẫn UI và nghiệp vụ. |
| `NetworkOverview.tsx` | 2339 dòng. Cấu trúc phức tạp, nhiều biểu đồ và trạng thái lồng nhau. |
| `_app.he-thong.$id.tsx` | 1871 dòng. Quá nhiều tab và logic hiển thị chi tiết tài sản. |
| `_app.so-do.$id.tsx` | 1661 dòng. Tương tác React Flow phức tạp, nhiều inline style. |
| `CatalogTable.tsx` | 1406 dòng. Nhân bản logic từ StandardTable nhưng có biến thể. |
| `CommandPalette.tsx` | 1071 dòng. Logic tìm kiếm và phím tắt phức tạp. |
| `ThanhPhanChiTietDialog.tsx` | 864 dòng. Dialog chi tiết quá lớn, vi phạm nguyên tắc "tinh gọn". |
| `sidebar.tsx` (UI) | 744 dòng. Component gốc từ shadcn đã bị tùy biến quá nhiều. |
| `GraphCanvas.tsx` | 749 dòng. Logic render canvas thủ công, khó bảo trì. |
| `PageBody.tsx` | Layout gốc có nhiều class Tailwind thô và logic tính toán chiều cao. |

## 3. Hợp nhất Component (src/components/mirats)

| Loại | Component đề xuất giữ lại | Các component sẽ bị thay thế/hợp nhất |
| :--- | :--- | :--- |
| **Badge** | `StatusBadge` | `Anomaly-`, `AutoFilled-`, `Code-`, `Expiring-`, `MultiRole-`, `Offline-`, `ReadOnly-` |
| **Toolbar** | `ListToolbar` | `ContextualToolbar` |
| **State** | `EmptyState` | `LoadingState`, `ErrorState` (dùng Astryx Skeleton/Error) |
| **Dialog** | `ResponsiveDialog` | `FormDialog`, `ConfirmDialog`, `TableExportDialog` và các Dialog nghiệp vụ nhỏ |
| **Table** | `StandardTable` | `CatalogTable`, `ThanhPhanTable`, `SparePartsTable` |

## 4. Xác nhận Route Pilot

1.  **Dashboard**: `src/routes/_app.index.tsx` - Đại diện tốt cho widget, chart và KPI.
2.  **Danh mục**: `src/routes/_app.danh-muc.thiet-bi.tsx` - Đại diện tốt cho bảng dữ liệu lớn.
3.  **Form động**: `src/routes/_app.forms.new.$code.tsx` - Đại diện tốt cho input, wizard và validation.
4.  **Chi tiết**: `src/routes/_app.he-thong.$id.tsx` - Đại diện tốt cho layout tabs và chi tiết thông tin.
5.  **Sơ đồ**: `src/routes/_app.so-do.$id.tsx` - Đại diện tốt cho đồ thị (React Flow) và tương tác canvas.

## 5. Rủi ro & Cảnh báo

- **React Version**: Dự án đã ở React 19, tương thích tốt với Astryx.
- **Tailwind v4 vs StyleX**: Astryx dùng StyleX. Việc dùng song song Tailwind v4 (CSS-in-CSS) và StyleX (CSS-in-JS) có thể gây xung đột về thứ tự ưu tiên (specificity).
- **Graph/Gantt**: `@xyflow/react` và `frappe-gantt` phụ thuộc nặng vào class CSS gốc. Việc chuyển sang StyleX có thể làm vỡ layout các component này nếu không xử lý kỹ phần "GIỮ NGUYÊN" code cũ.
- **Test Snapshots**: Thay đổi toàn bộ cấu trúc DOM từ shadcn sang Astryx sẽ làm hỏng mọi snapshot test hiện có.

## 6. Bảng Parity Gốc
Đã tạo tại `docs/ui-parity-baseline.md`.
