# Kế hoạch nâng cấp Tương tác và Ghim cột (StandardTable)

## 1. Mục tiêu

- **Pointer Events**: Hỗ trợ đa thiết bị (chuột, cảm ứng, bút) cho việc kéo đổi độ rộng cột.
- **Tối ưu hiệu năng**: Chỉ ghi dữ liệu vào Supabase khi kết thúc kéo; dùng `requestAnimationFrame` để cập nhật UI mượt mà.

* **Bàn phím**: Cho phép đổi độ rộng bằng phím mũi tên khi focus vào handle.

- **Ghim hai phía (Dual Sticky)**: Giữ cột chọn/mở rộng ở bên trái và ghim cột hành động ở bên phải.
- **Scroll Indicators**: Hiển thị bóng đổ ở mép các cột ghim để báo hiệu còn nội dung bị che.

## 2. Đặc tả kỹ thuật

### Bảng Z-index

| Cấu phần                      | Z-index | Ghi chú                              |
| :---------------------------- | :------ | :----------------------------------- |
| Dòng thường                   | 0       | Mặc định                             |
| Dòng đang chọn (Selected Row) | 1       | Để bóng đổ viền nổi lên              |
| Ô dính (Sticky Cells)         | 10      | Ghim trái/phải khi cuộn ngang        |
| Header thường                 | 20      | Chặn nội dung cuộn lên               |
| Header dính (Sticky Headers)  | 30      | Kết hợp ghim ngang và ghim dọc       |
| Resizer Handle (Active)       | 40      | Luôn nằm trên cùng khi đang thao tác |

### Bố cục ghim (Sticky Logic)

- **Bên trái**: `left` = tích lũy bề rộng của các cột ghim trước đó.
  - Cột mở rộng (nếu có): `left: 0`.
  - Cột chọn: `left: 40px` (nếu có cột mở rộng) hoặc `0`.
- **Bên phải**: `right` = tích lũy bề rộng cột ghim bên phải (thường chỉ có `actions`).
  - Cột `actions`: `right: 0`.

### Interaction Spec

- **Chuột/Cảm ứng**: Dùng `pointerdown` + `setPointerCapture`.
- **Bàn phím**:
  - `tabIndex={0}` trên handle.
  - `ArrowLeft/Right`: ±8px.
  - `Shift + Arrow`: ±32px.
  - `Enter/Escape`: Dừng thao tác.

## 3. Danh sách file sửa đổi

1. `src/components/mirats/StandardTable.tsx`:
   - Thay đổi state kéo (thêm `tempWidths` để update UI nhanh).
   - Triển khai Pointer Events handlers.
   - Tính toán `sticky` left/right động.
   - Thêm phần tử bóng đổ (shadow mask) dựa trên trạng thái cuộn.
2. `src/lib/mirats/ui/table-geometry.ts`:
   - Cập nhật helpers tính toán offset cho sticky columns.
3. `src/styles.css`:
   - Thêm class `sticky-shadow-left` và `sticky-shadow-right`.

## 4. Các bước thực hiện (Commits)

1. **Refactor Drag Logic**: Chuyển sang Pointer Events & Temp state.
2. **Keyboard Accessibility**: Thêm focus và arrow key handling cho resizer.
3. **Dual Sticky Columns**: Triển khai `sticky right` cho cột `actions`.
4. **Visual Cues**: Thêm hiệu ứng bóng đổ khi cuộn (Scroll shadows).
5. **Optimization**: Batch update `setWidthsBatch` khi kết thúc thao tác.

## 5. Rủi ro và Giải pháp

- **Xung đột kéo độ rộng vs kéo thứ tự**: Khi đang `isDragging` độ rộng, vô hiệu hóa `draggable` của header.
- **Hiệu năng re-render**: Dùng `tempWidths` chỉ ảnh hưởng tới `colgroup` thông qua `ref` hoặc một state tối thiểu.
- **Trình duyệt cũ**: `sticky` hiện đã hỗ trợ tốt, fallback là cuộn thường.
