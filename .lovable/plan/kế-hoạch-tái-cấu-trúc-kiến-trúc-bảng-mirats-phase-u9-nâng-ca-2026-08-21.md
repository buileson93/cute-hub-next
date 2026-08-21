# Kế hoạch: Tái cấu trúc Kiến trúc Bảng MIRATS (Phase U9 - Nâng cao)

Dựa trên yêu cầu tối ưu hóa trải nghiệm người dùng, đặc biệt là hệ thống bảng dữ liệu và thanh cuộn ngang, kế hoạch này tập trung vào việc tạo ra một `DataTableCore` mạnh mẽ, linh hoạt và có thẩm mỹ cao.

## Mục tiêu chính
- **Thanh cuộn ngang tinh tế:** Thiết kế mỏng, mượt, luôn hiển thị trong vùng nhìn thấy (viewport) mà không cần cuộn xuống cuối trang.
- **Thống nhất kiến trúc:** Loại bỏ sự chồng chéo giữa `StandardTable`, `ui/table` và `RawTableWrapper`.
- **Hiệu năng & Mobile:** Đảm bảo khả năng cuộn mượt mà và hiển thị tốt trên thiết bị di động.

## Các giai đoạn triển khai

### Giai đoạn 0: Tối ưu hóa Trải nghiệm Cuộn (Scroll Experience)
- **Thiết kế Scrollbar:** Cập nhật `mirats-scroll` trong `src/styles.css` để thanh cuộn ngang mỏng hơn (thin), màu sắc tinh tế (subtle) và có độ bo góc mượt mà.
- **Viewport Constraints:** Điều chỉnh `DataTableCore` để tự động tính toán `max-height` dựa trên vị trí của nó trong trang (hoặc nhận prop `fitViewport`), đảm bảo thanh cuộn ngang luôn nằm ở đáy vùng nhìn thấy.

### Giai đoạn 1: Audit & Phân loại (Audit & Classification)
- Rà soát 3 đường render hiện tại: `StandardTable`, `components/ui/table`, `RawTableWrapper`.
- Phân nhóm Use case: 
  - **Simple:** Danh sách ngắn, ít tương tác.
  - **Data-heavy:** Nhiều cột, cần sticky columns/header.
  - **Editable:** Cho phép sửa trực tiếp trên cell.
  - **Matrix/Report:** Bảng tổng hợp phức tạp.

### Giai đoạn 2: Hoàn thiện DataTableCore Architecture
- **Core Engine:** Củng cố `DataTableCore` với các hooks quản lý trạng thái (sort, filter, pagination).
- **Cell Registry:** Hệ thống render cell linh hoạt dựa trên `ColumnDef`.
- **Mobile Renderer:** Tự động chuyển đổi sang dạng `Card List` hoặc `Horizontal Scroll` tùy theo cấu hình trên mobile.
- **Adapter Layer:** Đảm bảo tương thích 100% với `ColumnDef` cũ của TanStack Table.

### Giai đoạn 3: Triển khai Pilot & Kiểm định (Pilot & Validation)
- **Chọn Pilot:** Trang **Thiết bị** (`/thiet-bi`) - màn hình có lượng dữ liệu lớn và nhiều lỗi UI nhất.
- **Kiểm tra (RED/GREEN):**
  - Nested scroll (cuộn trong cuộn).
  - Sticky header & Sticky columns (đặc biệt là cột ID và Thao tác).
  - Keyboard navigation (điều hướng phím).
  - Tốc độ render & Bundle impact.

### Giai đoạn 4: Di chuyển diện rộng (Full Migration)
- Sau khi Pilot thành công, lập backlog di chuyển các màn hình còn lại.
- Mỗi task di chuyển được chia nhỏ 2-5 phút, kèm theo lệnh verify cụ thể.

## Chi tiết kỹ thuật

### 1. Thanh cuộn ngang (Horizontal Scrollbar)
Cập nhật CSS để thanh cuộn trông "tinh tế" hơn:
```css
.mirats-scroll::-webkit-scrollbar {
  height: 4px; /* Rất mỏng cho thanh ngang */
}
.mirats-scroll::-webkit-scrollbar-thumb {
  background: var(--muted-foreground);
  opacity: 0.3;
  border-radius: 10px;
}
```

### 2. Viewport Fitting Logic
Trong `DataTableCore.tsx`, sử dụng `useWindowSize` hoặc `ResizeObserver` để đảm bảo:
`maxHeight = window.innerHeight - topOffset - footerHeight`.

## Kế hoạch Task (Task Breakdown)
1. **Task U9.A:** Refactor `src/styles.css` cho thanh cuộn "tinh tế". (3 min)
2. **Task U9.B:** Cập nhật `DataTableCore.tsx` hỗ trợ `fitViewport` mode. (5 min)
3. **Task U9.C:** Audit `src/routes/_app.thiet-bi.index.tsx` và chuẩn bị dữ liệu mock cho test. (4 min)
4. **Task U9.D:** Di chuyển `/thiet-bi` sang `DataTableCore` và verify sticky columns. (5 min)

---
*Dừng lại để chờ duyệt kế hoạch trước khi thực hiện.*
