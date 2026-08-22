# Kế hoạch khắc phục lỗi build Production (Unexpected Token)

## Vấn đề hiện tại
Quá trình build production bị lỗi "Unexpected token" tại `src/components/mirats/StandardTable.js:429:38`. Lỗi này thường xảy ra do Vite/Rolldown transform không xử lý tốt các biểu thức JSX phức tạp nằm bên trong các toán tử logic (`&&`, `? :`) hoặc các hàm render được gọi trực tiếp trong JSX mà không được bọc kỹ.

Dựa trên mã nguồn, dòng 429 trong file `.js` tương ứng với vùng mã quanh logic render các hàng hoặc các trạng thái toàn cục trong `StandardTable.tsx`.

## Các bước thực hiện

1. **Phân rã JSX phức tạp trong `StandardTable.tsx`**
   - Chuyển các biểu thức ternary/logic phức tạp thành các biến được tính toán trước hoặc các hàm render tường minh có giá trị trả về rõ ràng (không trả về `null` trần mà trả về `<></>` hoặc thẻ ẩn nếu cần).
   - Đảm bảo các hàm như `renderGlobalState()` luôn được gọi trong một block an toàn.

2. **Khắc phục lỗi "Unexpected JSX expression" trong `ThanhPhanTable.tsx`**
   - Rà soát các cell renderer trong `ThanhPhanTable.tsx` (đặc biệt là các đoạn code đã được báo cáo ở line 152 và các vùng lân cận).
   - Chuyển các đoạn JSX inline thành các functional component nhỏ hoặc sử dụng biến trung gian để Vite dễ dàng transform.

3. **Đồng bộ hóa API `StandardTable`**
   - Đảm bảo tất cả các props mới được thêm vào (`editMode`, `tableKey`, v.v.) được định nghĩa đầy đủ trong interface và được sử dụng nhất quán.

4. **Kiểm tra và Xác minh**
   - Chạy `npm run build:dev` (chế độ development build nhưng dùng Vite transform tương tự production).
   - Nếu thành công, tiến hành kiểm tra lại mã nguồn để đảm bảo không còn cú pháp gây tranh cãi cho compiler.

## Chi tiết thay đổi kỹ thuật

### StandardTable.tsx
- Refactor phần render body của bảng để tách biệt logic "Mobile vs Desktop" và "Empty/Loading vs Data".
- Thay thế `null` bằng `<div className="hidden" aria-hidden="true" />` trong các hàm render phụ trợ để tránh lỗi transform biểu thức trống.

### ThanhPhanTable.tsx
- Refactor các `cell: (r) => { ... }` có logic phức tạp thành các component riêng biệt (ví dụ: `StatusCell`, `ActionCell`).

### Cập nhật giao diện gỡ lỗi
- Cập nhật `src/routes/__root.tsx` để hiển thị đúng thông tin lỗi mà người dùng yêu cầu để phục vụ việc track tiến độ.
