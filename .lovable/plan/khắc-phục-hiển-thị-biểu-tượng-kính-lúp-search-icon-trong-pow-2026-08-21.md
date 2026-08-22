# Khắc phục hiển thị biểu tượng kính lúp (Search Icon) trong PowerSearch

Người dùng phản hồi biểu tượng kính lúp (search icon) không hiển thị hoặc bị lỗi hiển thị trong thanh tìm kiếm PowerSearch (TopBar). Phân tích cho thấy nguyên nhân nằm ở việc cấu trúc lại `TopBar` trước đó có thể đã làm thay đổi cách biểu tượng được định vị hoặc bị đè bởi các thành phần khác do `z-index` hoặc lỗi render trong component `Button`.

## Phân tích nguyên nhân

- **TopBar**: Component `Button` bao quanh ô tìm kiếm có logic `renderContent` phức tạp, có thể đang ẩn hoặc đẩy icon ra ngoài vùng nhìn thấy.
- **Icon Overlap**: Trong `TopBar.tsx`, nút tìm kiếm đang có `px-0` nhưng bên trong lại có `px-3` ở `div` chứa icon, điều này có thể gây ra sai lệch vị trí.
- **Search Icon count**: Kết quả Playwright cho thấy có 2 icon bên trong nút, có thể là do `Search` icon chính và icon `Loader2` (đang ẩn) hoặc logic render trùng lặp trong `Button`.

## Các thay đổi chính

### 1. Refactor TopBar Search Button Layout

- Đảm bảo icon `Search` luôn hiển thị ở vị trí đầu tiên bên trái với `shrink-0`.
- Sử dụng cấu trúc Flexbox ổn định, không dùng `absolute` cho các thành phần chính của thanh tìm kiếm.
- Cập nhật lại padding để icon không sát mép hoặc bị cắt.

### 2. Tối ưu component Button.tsx

- Kiểm tra logic `renderContent` để đảm bảo khi `size="icon"` hoặc khi có icon đi kèm text, biểu tượng không bị `opacity-0` nhầm lẫn với trạng thái `loading`.
- Đảm bảo `Loader2` (spinner) không chiếm chỗ của icon tìm kiếm khi không ở trạng thái tải.

### 3. Đồng nhất icon kính lúp trong PowerSearch Dialog

- Kiểm tra `PowerSearch.tsx` để đảm bảo icon `Search` trong input của hộp thoại cũng hiển thị rõ nét và đúng vị trí.

## Chi tiết kỹ thuật

### Tệp tin bị ảnh hưởng

- `src/components/mirats/app-shell/TopBar.tsx`
- `src/components/ui/button.tsx`
- `src/components/mirats/search/PowerSearch.tsx`

### Kiểm tra (Verification)

- Sử dụng Playwright để chụp ảnh chi tiết nút tìm kiếm.
- Kiểm tra thuộc tính `display`, `visibility`, và `opacity` của phần tử `svg` bên trong nút.
