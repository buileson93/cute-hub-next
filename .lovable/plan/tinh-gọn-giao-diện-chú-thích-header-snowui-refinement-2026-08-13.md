# Tinh gọn Giao diện Chú thích & Header (SnowUI Refinement)

## A. Kế hoạch sửa trùng Header (ThanhPhanTable làm mẫu)

Lỗi trùng lặp tại `/he-thong/thanh-phan` sẽ được xử lý bằng cách loại bỏ hoàn toàn khối header trong component con và chuyển quy tắc nghiệp vụ vào `help` của `PageHeader`.

### 1. Phân tích đoạn lặp

- **Route (`_app.he-thong.thanh-phan.tsx`)**: Vẽ `PageHeader` với description dài.
- **Component (`ThanhPhanTable.tsx`)**: Vẽ thêm `h1` và `p` (dòng 400-413) mô tả các cấp hệ thống.
- **Kết quả**: Thừa ~90px, nội dung lặp lại 2 lần.

### 2. Hành động

- **Xóa** khối header (dòng 397-441) trong `ThanhPhanTable.tsx`.
- **Cập nhật** `PageHeader` trong route để dùng `help` thay cho `description`.
- **Port** thông tin "Thành phần chưa lắp tài sản..." vào tooltip của `InfoHint`.

---

## B. Bảng kiểm toán Chữ chú thích (Audit & Phân bậc)

| File                      | Dòng | Nội dung gốc                         | Bậc | Hành động & Điểm đến                                      | Tiết kiệm (px) |
| :------------------------ | :--: | :----------------------------------- | :-: | :-------------------------------------------------------- | :------------: |
| `ThanhPhanTable.tsx`      | 412  | "Bảng ở mức thành phần hệ thống..."  |  1  | **XOÁ** (Dư thừa vì các cột đã thể hiện điều này)         |      40px      |
| `ThanhPhanTable.tsx`      | 413  | "Thành phần chưa lắp tài sản thì..." |  2  | **TOOLTIP** (Chuyển vào `help` của PageHeader)            |       -        |
| `_app.he-thong.cay.tsx`   | 331  | "Mindmap hệ thống..."                |  1  | **XOÁ** (Tiêu đề tab đã đủ rõ)                            |      20px      |
| `_app.he-thong.$id.tsx`   | 359  | "Sổ lý lịch" (Breadcrumb lặp)        |  1  | **XOÁ** (Đã có breadcrumb ở TopBar)                       |      15px      |
| `_app.danh-muc.model.tsx` | 367  | "Gắn hình ảnh minh hoạ..."           |  3  | **RÚT NGẮN** (Subtitle: "Quản lý mẫu tài sản & hình ảnh") |      10px      |

**Tổng chiều cao tiết kiệm ước tính**: 80px - 120px trên mỗi trang chính.

---

## C. Quy tắc 3 Slot của PageHeader

Cưỡng chế giới hạn ký tự để đảm bảo giao diện luôn sạch.

| Slot            | Mục đích               |    Giới hạn    | Quy tắc hiển thị                          |
| :-------------- | :--------------------- | :------------: | :---------------------------------------- |
| **subtitle**    | Trạng thái/Phạm vi     |   < 30 ký tự   | Luôn hiện, cùng hàng với title            |
| **description** | Chỉ dẫn hành động khẩn |   < 80 ký tự   | Hiện dưới title, chỉ dùng khi thật sự cần |
| **help**        | Quy tắc/Định nghĩa     | Không giới hạn | **Ẩn trong InfoHint (tooltip)**           |

_Ghi chú: Nếu description > 80 ký tự, bắt buộc phải chuyển vào `help` hoặc `HelpDrawer`._

---

## D. Kế hoạch chuyển đổi Tooltip (title="..." → AppTooltip)

Có 276 thuộc tính `title`.

1. **Nhóm A (Nút icon-only)**: Chuyển `title` thành `aria-label` + `AppTooltip`.
2. **Nhóm B (Dữ liệu bị cắt - truncate)**: Chuyển `title` thành `AppTooltip` để có định dạng đẹp hơn.
3. **Nhóm C (Phụ trợ)**: Giữ `title` gốc nếu không ảnh hưởng thẩm mỹ (ví dụ: title trên thẻ `abbr`).

---

## E. Dọn dẹp border-dashed và Alert

- **border-dashed**: Chỉ giữ lại ở `FileUpload` (vùng thả tệp) và `EmptyState`. Mọi khối "gợi ý" dùng viền này sẽ được gỡ bỏ hoặc chuyển thành `Card` chuẩn.
- **Alert**:
  - Nếu là hướng dẫn sử dụng: Chuyển thành tooltip `help`.
  - Nếu là cảnh báo trạng thái: Giữ nguyên nhưng chỉ hiện khi có lỗi (ví dụ: `!data` hoặc `error`).

---

## F. Thứ tự thực thi (Commit Strategy)

1. **Commit 1**: Fix trùng header tại `/he-thong/thanh-phan` (Ví dụ mẫu).
2. **Commit 2**: Refactor `PageHeader` để tự động đẩy description dài vào `InfoHint` nếu vượt ngưỡng.
3. **Commit 3**: Dọn dẹp 3 file nặng nhất: `ThanhPhanTable`, `_app.he-thong.$id.tsx`, `_app.danh-muc.model.tsx`.
4. **Commit 4**: Quét và chuyển đổi `title="..."` sang `AppTooltip` cho các nút điều hướng chính.

---

## G. Chống tái diễn

- Thêm rule trong `src/components/mirats/PageHeader.tsx` để cảnh báo (console.warn trong dev) nếu `description` quá dài.
- Cập nhật tài liệu hướng dẫn phát triển tại `mem://design/ui-density`.
