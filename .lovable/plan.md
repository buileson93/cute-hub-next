# Kế hoạch Tối ưu hoá Hiển thị Mobile & Cột Ưu tiên — MIRATS 2.0

Dự án hiện tại gặp vấn đề khi hiển thị bảng trên mobile: nội dung Card bị fix cứng ở 5 cột đầu và mất khả năng tương tác sâu. Kế hoạch này tối ưu hoá cơ chế Responsive của `StandardTable` bằng cách sử dụng khái niệm **Priority** (Mức ưu tiên) cho cột và **Dòng mở rộng (Row Expansion)** cho các cột bị ẩn.

## 1. Kiến trúc Cột Ưu tiên (Priority System)

### 1.1. Đặc tả StdColumn mới
Bổ sung thuộc tính `priority` vào `StdColumn<T>`:
- `primary`: Luôn hiển thị. Là tiêu đề chính của Card mobile. (Ví dụ: Mã thiết bị, Tên).
- `secondary`: Hiển thị trên máy tính bảng và là các dòng chi tiết trong Card mobile. (Ví dụ: Model, Serial, Trạng thái).
- `detail`: Chỉ hiển thị khi khung hình rộng (Desktop) hoặc khi người dùng "Mở rộng" dòng.

### 1.2. Quy tắc suy diễn (Backward Compatibility)
Để không phải sửa 29 file sử dụng, `priority` được suy diễn nếu để trống:
- 2 cột đầu tiên (hoặc cột `ma`, `ten` nếu có): `primary`.
- 3 cột tiếp theo: `secondary`.
- Các cột còn lại: `detail`.

## 2. Chiến lược Hiển thị theo Bề rộng (Container-based)

Sử dụng `ResizeObserver` (đã có) để đo bề rộng khung bảng, không dùng `window.innerWidth`.

| Bề rộng khung | Dạng hiển thị | Hành động |
| :--- | :--- | :--- |
| **Desktop** (> 768px) | Bảng đầy đủ (Standard Table) | Sắp xếp, Lọc, Kéo thả, Hành động dòng |
| **Tablet** (480px - 768px) | Bảng thu gọn (Collapsed Table) | Ẩn cột `detail`, thêm cột "Mở rộng" (+). |
| **Mobile** (< 480px) | Danh sách thẻ (Card List) | Nội dung lấy từ `primary` & `secondary`. Menu hành động floating. |

## 3. Dòng mở rộng (Expandable Rows)

Thay vì dùng Dialog, sử dụng cơ chế `collapsible` ngay trong bảng:
- Khi bảng ở chế độ Tablet/Desktop mà có cột bị ẩn do `hideBelow` hoặc `priority`, một cột icon "Mở rộng" sẽ xuất hiện ở đầu.
- Khi bấm, một dòng phụ (`tr`) sẽ xuất hiện ngay dưới, span toàn bộ chiều rộng bảng, hiển thị các thông tin bị ẩn dưới dạng `Label: Value`.
- Đảm bảo tương thích với `react-virtual`: Dòng mở rộng phải được tính vào kích thước ảo hoá hoặc dùng `measureElement`.

## 4. Tối ưu hoá Mobile Card

Khôi phục các tính năng bị mất trên mobile:
- **Tiêu đề Card**: Dùng cột `primary`.
- **Nội dung Card**: Dùng cột `secondary`.
- **Menu hành động**: Một nút "Ba chấm" ở góc Card mở `DropdownMenu` chứa các hành động dòng.
- **Sắp xếp/Lọc**: Thay vì header bảng, thêm một nút "Sắp xếp & Lọc" ở Toolbar mobile mở một Sheet/Dialog để chọn tiêu chí.

## 5. Danh sách thay đổi chi tiết theo File

### `src/components/mirats/StandardTable.tsx`
- Cập nhật interface `StdColumn`: thêm `priority`.
- Refactor `isMobile` thành `viewMode: 'desktop' | 'tablet' | 'mobile'`.
- Implement `RowExpansion` component.
- Cập nhật `MobileCard`: render dựa trên priority.
- Thêm `lodash.debounce` cho `ResizeObserver` callback (giảm giật lag).

### `src/lib/mirats/ui/ui-density.ts`
- Thêm các mốc bề rộng khung (Container breakpoints): `CONT_MD: 768`, `CONT_SM: 480`.

## 6. Đề xuất Priority cho 5 bảng lớn nhất

| Bảng | Primary | Secondary | Detail |
| :--- | :--- | :--- | :--- |
| **Thành phần** | Mã, Tên | Trạng thái, Model, Serial | Đơn vị, NSX, NCC, Ngày mua |
| **Tài sản** | Mã, Tên | Trạng thái, Vị trí, Model | Serial, P/N, Hạn bảo hành |
| **Sự cố** | Mã, Tiêu đề | Mức độ, Trạng thái, Tài sản | Người báo, Thời gian, Mô tả |
| **Bảo trì** | Số phiếu, Loại | Trạng thái, Ngày thực hiện | Đơn vị thực hiện, Ghi chú |
| **Danh mục** | Mã, Tên | Số tài sản | Mô tả, Active, Thứ tự |

## 7. Kế hoạch Kiểm thử (Test Cases)
1. **Responsive**: Thu hẹp sidebar, kiểm tra bảng chuyển từ Desktop -> Tablet (ẩn cột detail) -> Mobile (chuyển Card).
2. **Expansion**: Bấm nút (+) ở chế độ Tablet, kiểm tra dòng mở rộng hiển thị đúng thông tin bị ẩn.
3. **Mobile Interaction**: Chọn nhiều dòng trên mobile, thực hiện hành động hàng loạt (bulk actions).
4. **Performance**: Cuộn nhanh danh sách 1000 dòng trên mobile (giả lập) để kiểm tra độ mượt của ảo hoá khi có thẻ phức tạp.

**Lưu ý**: Tuyệt đối giữ nguyên logic `hideBelow` để các call site cũ không bị hụt cột đã cấu hình cứng.
