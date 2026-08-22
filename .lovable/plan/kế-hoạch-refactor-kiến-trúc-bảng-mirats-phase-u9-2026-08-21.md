# Kế hoạch: Refactor Kiến trúc Bảng MIRATS (Phase U9)

Mục tiêu là thống nhất hạ tầng hiển thị dữ liệu, loại bỏ các lỗi cuộn (nested scroll), tiêu đề không cố định (sticky header), và xung đột CSS giữa các thư viện. Chúng ta sẽ xây dựng một lõi `DataTableCore` mạnh mẽ, hỗ trợ tốt cả Desktop và Mobile mà không thay đổi ngôn ngữ thiết kế MIRATS Blue.

## Phân tích Audit (Pha 1)

Hiện tại hệ thống có 3 đường render bảng chồng chéo:

- **StandardTable.tsx**: Phức tạp nhất (1700+ dòng), chứa nhiều logic hỗn hợp (virtualization, filtering, export). Đang gặp lỗi cuộn ngang và hitbox nút.
- **components/ui/table.tsx**: Shadcn primitive, bị ghi đè bởi CSS global `table th/td`.
- **RawTableWrapper.tsx**: Giải pháp tình thế cho Group B, dùng CSS selector để ép kiểu.

### Ma trận Use Case

1. **Simple**: Bảng danh mục nhỏ, không phân trang (CatalogTable).
2. **Data-heavy**: Danh sách thiết bị/vật tư, cần ảo hóa (StandardTable).
3. **Editable**: Bảng nhập liệu trực tiếp (ThanhPhanTable).
4. **Report**: Bảng kiểm tra số liệu, cần sticky header/col (StandardTable).

## Thiết kế Kiến trúc Mới (DataTableCore)

Chúng sẽ tách biệt mối quan tâm:

- **`DataTableCore`**: Chỉ lo hiển thị Table/Viewport và Keyboard navigation.
- **`CellRegistry`**: Định nghĩa cách render chuẩn cho `id`, `status`, `currency`, `date`.
- **`MobileRenderer`**: Tự động chuyển sang `MobileRecordCard` khi màn hình < 768px.
- **`useDataTable`**: Hook quản lý state (sort, filter, selection) độc lập với UI.

## Lộ trình Thực hiện

### Pha 1: Chuẩn bị & Test Fixture (U9.1)

- Tạo route `/lovable/table-audit` hiển thị 4 loại bảng pilot.
- Viết Playwright baseline để đo `getBoundingClientRect` của header và scroll container.
- **Constraint**: Không sửa code logic business.

### Pha 2: Tinh lọc CSS & Hạ tầng (U9.2)

- Di chuyển styles từ `table th/td` global trong `styles.css` vào các utility class có scope rõ ràng.
- Đảm bảo `sticky top-0` hoạt động ổn định với `backdrop-blur`.
- File chính: `src/styles.css`, `src/components/ui/table.tsx`.

### Pha 3: Triển khai DataTableCore & Pilot (U9.3)

- Chọn màn hình **Thư viện tài liệu** (`src/routes/_app.tai-lieu.tsx`) làm pilot.
- Migrate từ `StandardTable` cũ sang kiến trúc mới.
- Kiểm tra: `overflow-x`, `sticky header`, mobile readability.

### Pha 4: Dọn dẹp & Tối ưu (U9.4)

- Áp dụng cho các màn hình Data-heavy còn lại.
- Xóa code chết trong `StandardTable.tsx` sau khi migrate xong.

## Danh sách Selector & Token dự kiến thay đổi

- **Selectors**:
  - Loại bỏ: `table th`, `table td` (global in `styles.css`).
  - Thêm: `.mirats-table-root`, `.mirats-table-viewport`.
- **Tokens**:
  - `UI_DENSITY.TABLE_H`: chuẩn hóa từ 32px đến 40px tùy mật độ.
  - `UI_DENSITY.TABLE_FS`: tối thiểu 12px cho data.

Dừng lại tại đây để người dùng duyệt kế hoạch.
