# Kế hoạch Cải thiện Trợ năng và Nhất quán Trạng thái cho StandardTable

MỤC TIÊU: Nâng cao trải nghiệm người dùng qua việc tuân thủ các tiêu chuẩn trợ năng (WCAG), đồng thời hợp nhất các trạng thái hiển thị (Đang tải, Lỗi, Rỗng) giữa giao diện Desktop và Mobile.

## 1. Bảng đối chiếu trạng thái

| Trạng thái | Điều kiện | Nội dung Desktop | Nội dung Mobile | Hành động đề xuất |
| :--- | :--- | :--- | :--- | :--- |
| **Đang tải** | `trangThai.dangTai` | Skeleton theo số cột | Skeleton theo số dòng thẻ | Hiện vùng aria-live "Đang tải" |
| **Lỗi** | `trangThai.loi` | Banner lỗi trung tâm | Card lỗi trung tâm | Nút "Thử lại" (nếu có) |
| **Rỗng (Mặc định)** | `rows.length === 0` | EmptyState: "Không có dữ liệu" | EmptyState: "Không có dữ liệu" | Thêm dữ liệu |
| **Rỗng (Bộ lọc)** | `fullDisplay.length === 0 && hasFilter` | EmptyState + Nút xóa lọc | EmptyState + Nút xóa lọc | Nút "Xoá tất cả bộ lọc" |
| **Rỗng (Gated)** | `requireFilterToShow && !hasFilter` | EmptyState: "Vui lòng chọn bộ lọc" | EmptyState: "Vui lòng chọn bộ lọc" | Hướng dẫn chọn lọc |
| **Rỗng (Quyền)** | `gated === true` | EmptyState: "Không có quyền" | EmptyState: "Không có quyền" | Yêu cầu cấp quyền |

## 2. Danh sách sửa đổi Trợ năng (Accessibility)

### Header & Sắp xếp
- **aria-sort**: Thêm vào `TableHead` khi cột đó đang được sắp xếp (`ascending`, `descending` hoặc `none`).
- **Phím tắt**: Cho phép Tab vào header button, Enter/Space để kích hoạt sắp xếp.
- **Scope**: Thêm `scope="col"` cho `TableHead`.

### Body & Dòng
- **Scope Row**: Thêm `scope="row"` cho ô đầu tiên của mỗi dòng (thường là Mã tài sản/Tên).
- **Nhãn checkbox**: Thêm `aria-label` cho Checkbox chọn dòng (ví dụ: "Chọn dòng {ma_thiet_bi}").
- **Nhãn chọn tất cả**: Thêm `aria-label="Chọn tất cả các dòng"`.

### Thông báo trạng thái (Aria-live)
- **Vùng Live**: Thêm một `div` ẩn với `aria-live="polite"` để thông báo số lượng kết quả khi bộ lọc thay đổi (ví dụ: "Đã tìm thấy 827 bản ghi").

### Tương tác Hover/Focus
- **Hành động**: Đảm bảo các nút hành động (ví dụ: Chi tiết, Sửa) chỉ hiện khi hover cũng phải hiện được khi dòng đó nhận Focus bằng bàn phím.

## 3. Chi tiết thay đổi theo file

### `src/components/mirats/StandardTable.tsx`
- Hợp nhất logic render `EmptyState` giữa Desktop và Mobile vào một hàm helper duy nhất.
- Cập nhật `displayItems.map` để thêm nhãn trợ năng cho các ô chọn.
- Thêm `useEffect` để cập nhật nội dung cho vùng `aria-live` khi `fullDisplay.length` thay đổi.
- Bổ sung `onKeyDown` cho header resizer (phím mũi tên để thay đổi độ rộng).

### `src/components/mirats/EmptyState.tsx`
- Đảm bảo `aria-live` được cấu hình đúng cho các trường hợp render động.

## 4. Kiểm chứng

- **Bàn phím**: Dùng Tab/Shift+Tab để di chuyển qua toàn bộ bảng, Enter để chọn/sắp xếp.
- **Screen Reader**: Kiểm tra việc đọc tiêu đề cột, trạng thái sắp xếp và thông báo khi lọc dữ liệu.
- **Visual**: Kiểm tra màu sắc dòng được chọn (`bg-primary/5 border-primary`) và hover (`bg-muted/60`).

KHÔNG ĐƯỢC:
- Giữ nguyên các văn bản tiếng Việt hiện có (ví dụ: "Không có dòng nào khớp bộ lọc").
- Không thêm thư viện ngoài.
- Giữ nguyên logic `gated` và `requireFilterToShow`.
