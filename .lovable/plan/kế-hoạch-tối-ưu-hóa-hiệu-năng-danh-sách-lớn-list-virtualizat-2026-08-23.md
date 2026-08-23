# Kế hoạch tối ưu hóa hiệu năng danh sách lớn (List Virtualization)

Ứng dụng hiện đang gặp vấn đề hiệu năng khi render danh sách lớn (có thể lên tới 100.000+ phần tử). Toàn bộ phần tử được render vào DOM khiến FPS tụt giảm nghiêm trọng khi cuộn. Kế hoạch này tập trung vào việc thay đổi cơ chế render sang ảo hóa danh sách (List Virtualization) để đảm bảo hiệu năng ổn định bất kể số lượng phần tử.

## Ràng buộc quan trọng
- Không thay đổi bất kỳ văn bản, label, aria-label, title nào hiển thị cho người dùng.
- Không thay đổi giao diện trực quan (màu sắc, font, spacing, class CSS).
- Giữ nguyên hành vi logic của các item (click, hover, sự kiện).
- Không sửa đổi các component không liên quan (như đồng hồ).

## Các bước thực hiện

### Bước 1: Xác định và Kiểm tra các Component danh sách
- Tập trung vào `StandardTable.tsx`, `DataTableCore.tsx` và các panel liên quan (`AssetTablePanel.tsx`, `ComponentTablePanel.tsx`).
- Mặc dù `StandardTable` đã có tích hợp `react-virtual`, nhưng cần kiểm tra xem nó có được kích hoạt đúng cách và hiệu quả cho mọi trường hợp hay không (đặc biệt là khi số lượng item cực lớn).

### Bước 2: Nâng cấp Cơ chế Ảo hóa (List Virtualization)
- Sử dụng `@tanstack/react-virtual` (đã có sẵn trong dự án) để quản lý windowing.
- Đảm bảo `StandardTable` luôn sử dụng virtualization khi số lượng item vượt quá ngưỡng hiển thị.
- Thiết lập `overscan` cố định hoặc thích nghi ở mức 3–5 item mỗi phía để cân bằng giữa độ mượt và số lượng DOM node.
- Sử dụng `translate3d` để định vị các item, giúp tận dụng tăng tốc phần cứng (GPU).
- Đảm bảo container danh sách có `overflow-y: auto` và chiều cao được xác định rõ ràng (Một Scroll Owner).

### Bước 3: Tối ưu DOM Lifecycle (Mount/Unmount)
- Đảm bảo các hàng (Rows) khi ra khỏi viewport + overscan sẽ thực sự bị unmount khỏi DOM, không chỉ đơn thuần là ẩn đi.
- Sử dụng `React.memo` cho các row component và cell component (`OptimizedCell`) để tránh re-render không cần thiết khi cuộn.

### Bước 4: Xử lý chiều cao item
- Mặc dù dự án ưu tiên chiều cao cố định theo density (compact: 36px, standard: 44px), vẫn đảm bảo cơ chế đo động (dynamic size) của `react-virtual` hoạt động ổn định nếu nội dung item co giãn.

### Bước 5: Cách ly hiệu năng UI
- Đảm bảo việc tính toán virtualization không chặn Main Thread.
- Kiểm tra tính độc lập giữa việc cuộn danh sách và các animation khác (như sidebar) để đảm bảo không bị giật lag chéo.

### Bước 6: Kiểm tra và Nghiệm thu
- Sử dụng Chrome DevTools Performance để đo FPS khi cuộn danh sách 100.000 item.
- Kiểm tra số lượng DOM node trong Elements panel để xác nhận chỉ có các node hiển thị hiện diện.
- So sánh giao diện trước/sau để đảm bảo tính toàn vẹn 100% về mặt hình ảnh và văn bản.

## Chi tiết kỹ thuật
- **Thư viện:** `@tanstack/react-virtual`.
- **Component chính:** `src/components/mirats/StandardTable.tsx`.
- **Cơ chế định vị:** `transform: translate3d(0, ${virtualRow.start}px, 0)`.
- **Tối ưu render:** `React.memo`, `will-change: transform`, `contain: content`.
