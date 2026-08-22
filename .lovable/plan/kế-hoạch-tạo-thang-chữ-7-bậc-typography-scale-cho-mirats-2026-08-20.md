# Kế hoạch Tạo thang chữ 7 bậc (Typography Scale) cho MIRATS

Kế hoạch này thiết lập hệ thống Typography chuẩn hóa gồm 7 bậc, tích hợp khả năng đáp ứng theo mật độ giao diện (Density), sử dụng lại các giá trị nền tảng từ `ui-density.ts`.

## Các bước thực hiện

### 1. Tạo nguồn sự thật duy nhất cho Typography

Tạo file `src/lib/mirats/ui/typography.ts` với các quy định sau:

- **Hằng số `TYPO`**: Chứa đúng 7 bậc: `DISPLAY`, `H1`, `H2`, `H3`, `BODY`, `LABEL`, `MONO`.
- **Tái sử dụng `UI_DENSITY`**:
  - `BODY` kế thừa từ `TEXT_BODY`.
  - `LABEL` kết hợp `TEXT_LABEL`, `TABLE_HEADER_FS`, `KPI_LABEL_FS`.
  - `MONO` kế thừa `TEXT_MONO`.
- **Ràng buộc mật độ**: Mỗi bậc bao gồm các class Tailwind cho 3 mức mật độ: `compact`, `comfortable`, `spacious` sử dụng `data-[density=...]`.
- **Tiêu chuẩn kích thước**:
  - `BODY` (compact): không nhỏ hơn `12px`.
  - `LABEL`: không nhỏ hơn `11px` (do đặc thù chữ hoa toàn bộ).
- **Chú thích**: Mỗi bậc sẽ có JSDoc ghi rõ mục đích sử dụng và các nơi không nên sử dụng.

### 2. Thiết lập Kiểm thử Tự động

Tạo file `src/lib/mirats/ui/__tests__/typography.test.ts` để đảm bảo tính toàn vẹn:

- Kiểm tra số lượng khóa trong `TYPO` (đúng 7).
- Kiểm tra kích thước tối thiểu (>= 11px) bằng cách quét chuỗi class.
- Kiểm tra sự hiện diện của biến thể `data-[density=comfortable]` cho mỗi bậc.
- Kiểm tra thuộc tính bắt buộc của `MONO` (`font-mono` và `tabular-nums`).

### 3. Nguyên tắc thực hiện

- **Chỉ tạo mới**: Không chỉnh sửa các file đang sử dụng `text-[Npx]` hiện có để tránh gây lỗi giao diện đang chạy.
- **Tính duy nhất**: Bất kỳ bậc chữ nào nằm ngoài danh sách 7 bậc này đều được coi là không tồn tại trong hệ thống chuẩn của MIRATS.

## Cấu trúc 7 bậc dự kiến

1. **DISPLAY**: Số liệu KPI lớn, tiêu đề trang đặc biệt.
2. **H1**: Tiêu đề trang chính (Main Header).
3. **H2**: Tiêu đề phân đoạn nội dung (Section Header).
4. **H3**: Tiêu đề nhóm, Widget Header.
5. **BODY**: Văn bản nội dung, đoạn hội thoại, mô tả.
6. **LABEL**: Nhãn form, tiêu đề cột bảng, chú thích nhỏ.
7. **MONO**: Số liệu kỹ thuật, mã định danh, bảng dữ liệu tài chính.
