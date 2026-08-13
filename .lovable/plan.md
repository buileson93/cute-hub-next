# Kế hoạch Chuẩn hoá Tương tác — MIRATS 2.0

Chuẩn hoá toàn bộ trạng thái tương tác (hover, focus, active, selected, disabled, loading, drag) theo cảm giác "Light and Clean" của SnowUI, giữ nguyên bảng màu chủ đạo oklch.

## A. Bảng trạng thái tương tác mục tiêu

| Thành phần | Hover | Focus | Active | Selected | Disabled | Duration | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hàng bảng** | Mức 1: `bg-muted/60` | Ring nội bộ | — | `bg-primary/5` | Opacity 0.5 | 120ms | Pointer nếu bấm được |
| **Item Sidebar** | `bg-muted` | Ring offset | `bg-primary/8` + Line | — | Opacity 0.5 | 120ms | Line mảnh 2px bên trái |
| **Nút chính** | Đậm hơn 10% | Ring 2px | Scale 0.98 | — | Not-allowed | 120ms | Dùng transition cụ thể |
| **Card bấm được** | Mức 2: Border + Shadow | Ring | Scale 0.99 | — | — | 200ms | Dùng shadow-sm |
| **KPI Card** | Mức 2 (nếu link) | Ring | — | — | — | 200ms | Card tĩnh không hover |
| **Input / Control** | Border primary | Ring 1px | — | — | Gray background | 120ms | — |
| **Node Mindmap** | Nền nhẹ + Nút | — | Ring primary | — | — | 320ms | Chỉ lập kế hoạch |

## B. Token tương tác bổ sung (styles.css)

```css
/* Trạng thái nền */
--hover-muted: oklch(0.965 0.004 250 / 0.6);
--hover-primary-light: oklch(0.46 0.22 264 / 0.08);
--active-primary-light: oklch(0.46 0.22 264 / 0.12);

/* Đổ bóng & Scale */
--shadow-hover: 0 4px 6px -1px oklch(0 0 0 / 0.05), 0 2px 4px -2px oklch(0 0 0 / 0.05);
--scale-active: 0.98;

/* Tiện ích chuyển động */
@utility transition-mirats-fast {
  transition-property: background-color, border-color, color, box-shadow, transform, opacity;
  transition-duration: var(--duration-fast);
  transition-timing-function: var(--ease-standard);
}
```

## C. Cải thiện Transition (Loại bỏ transition-all)

Thay thế `transition-all` bằng `transition-mirats-fast` hoặc các thuộc tính cụ thể tại 41 vị trí:
- **Hàng bảng & Danh sách**: Chỉ transition `background-color`.
- **Card**: Transition `border-color, box-shadow, transform`.
- **Sidebar**: Transition `background-color, color`.
- **Nút**: Giữ transition hiện tại trong `button.tsx` (đã khá cụ thể).

## D. Hợp nhất Focus-Visible

1.  **Global Rule**: Cập nhật `:focus-visible` trong `styles.css` dùng `oklch` và `ring-offset` để rõ ràng trên mọi nền.
2.  **Cleanup**: Xoá bỏ các class `focus-visible:ring-0`, `ring-primary`, `ring-ring` rải rác trong `StandardTable`, `TopBar`, `Input`, `Button` để dùng chung logic global.

## E. Rà soát vùng bấm được

| File | Vị trí | Vấn đề | Giải pháp |
| :--- | :--- | :--- | :--- |
| `StandardTable.tsx` | Toàn bộ hàng | Thiếu pointer/hover khi `onRowClick` có hiệu lực | Thêm `cursor-pointer hover:bg-muted/60` |
| `CayMindMap.tsx` | Node | Hover hiện tại quá mạnh (shadow-sm) | Chuyển sang Mức 1 (nền nhẹ) |
| `Sidebar.tsx` | Rail Logo | `group-hover:scale-[1.06]` quá lớn | Giảm xuống `scale-[1.02]` |
| `InventoryDashboard.tsx`| Mini cards | Thiếu feedback khi hover | Thêm Mức 2 |

## F. Kế hoạch triển khai (Commits)

1.  **Commit 1: Infrastructure**: Cập nhật `styles.css` với token mới và global focus ring.
2.  **Commit 2: Navigation**: Refactor `Sidebar.tsx` và `AppShell.tsx` (Rail/TopBar) đạt chuẩn tương tác.
3.  **Commit 3: Data Display**: Refactor `StandardTable.tsx` và `Card` (bao gồm KPI Dashboard).
4.  **Commit 4: Core Controls**: Cập nhật `button.tsx`, `input.tsx`, `badge.tsx` và các form control.
5.  **Commit 5: Optimization**: Quét toàn bộ repo thay thế `transition-all` và thêm `prefers-reduced-motion`.

## G. Kịch bản Test

-   **Mouse**: Di chuyển nhanh qua bảng 1000 dòng, kiểm tra hover không giật (no reflow).
-   **Keyboard**: Tab qua toàn bộ Sidebar, TopBar và Table Actions (nút thao tác ẩn phải hiện khi focus).
-   **Touch**: Kiểm tra các hành động hover (như nút xoá trong list) vẫn có thể kích hoạt bằng cách bấm (không bị ẩn vĩnh viễn).
-   **Motion**: Bật "Reduce Motion" trong OS, kiểm tra Scale/Slide biến mất nhưng đổi màu vẫn còn.
