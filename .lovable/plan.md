# Kế hoạch Thiết kế Mật độ hiển thị Rộng (Comfortable) cho người lớn tuổi

Mặc định hệ thống là **Tinh gọn (Compact)** để tối ưu diện tích hiển thị dữ liệu kỹ thuật. Tuy nhiên, để hỗ trợ người dùng lớn tuổi hoặc trong các điều kiện làm việc cần quan sát nhanh, kế hoạch này thực hiện khôi phục và tối ưu chế độ **Rộng (Comfortable)** với chữ to hơn, khoảng cách lớn hơn và các thành phần dễ tương tác hơn.

## Mục tiêu
- Thiết lập hệ thống token mật độ hiển thị linh hoạt (Compact vs Comfortable).
- Cung cấp nút chuyển đổi mật độ hiển thị dễ tìm trên thanh công cụ chính.
- Đảm bảo tất cả các thành phần quan trọng (Bảng, Cây hệ thống, Sơ đồ, Form) phản hồi đúng với chế độ mật độ được chọn.

## Các thay đổi chính

### 1. Cập nhật Token Mật độ (`src/lib/mirats/ui/ui-density.ts`)
- Hiệu chỉnh lại các giá trị `data-[density=comfortable]` để đảm bảo:
  - Row height: tăng từ ~30px lên 40-44px.
  - Font size: tăng từ 11px lên 13-14px.
  - Icon size: tăng từ 12px lên 16px.
  - Padding: tăng gấp đôi so với bản Compact.

### 2. Tích hợp Nút chuyển đổi Mật độ (`DensityToggle`)
- Chuyển `DensityToggle` vào `TopBar.tsx` hoặc `UserMenu` để người dùng dễ dàng thay đổi.
- Sử dụng `useUserPref` để lưu lựa chọn mật độ vào database/localStorage, giúp duy trì trạng thái sau khi tải lại trang.

### 3. Tối ưu hóa các Component cốt lõi theo Mật độ
- **Bảng (`StandardTable.tsx`)**:
  - Tự động điều chỉnh chiều cao ảo (`estimateRowHeight`) dựa trên mật độ để cuộn mượt mà.
  - Tăng khoảng cách đệm (`px`, `py`) và kích cỡ chữ trong ô dữ liệu.
- **Cây hệ thống & MindMap**:
  - Tăng kích thước node và khoảng cách giữa các node trong sơ đồ khi ở chế độ Comfortable.
  - Tăng cỡ chữ hiển thị nhãn (label).
- **Form & Dialog**:
  - Tăng `gap` giữa các trường nhập liệu.
  - Tăng kích thước nút bấm và `touch-target` để dễ thao tác trên thiết bị di động hoặc đối với người lớn tuổi.

### 4. Kỹ thuật triển khai
- Sử dụng thuộc tính `data-density` trên thẻ `<html>` hoặc container gốc (`AppShell`).
- Áp dụng các class Tailwind có tiền tố `data-[density=comfortable]:` để thay đổi style mà không cần viết lại Logic JS.
- Đảm bảo Logic `DensityToggle` đồng nhất với `useUserPref` đã có trong dự án.

## Kiểm tra (QA)
- [ ] Chuyển đổi giữa 2 chế độ và kiểm tra độ phản hồi của Bảng Thiết bị.
- [ ] Kiểm tra cỡ chữ tại Cây hệ thống (TreeView) xem đã đạt mức dễ đọc (14px) ở chế độ Comfortable chưa.
- [ ] Đảm bảo nút chuyển đổi có mô tả rõ ràng (Tooltip/Aria-label) tiếng Việt.
