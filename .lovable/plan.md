# Plan: Sửa lỗi hiển thị Input Login (Viền và Text không khớp)

Người dùng báo cáo viền của ô nhập liệu (Input) tại trang Login không khớp với nội dung bên trong (text lệch hoặc tràn viền) như hình ảnh đính kèm. Qua kiểm tra `src/routes/auth.tsx`, phát hiện thành phần `Field` đang sử dụng một `div` bao ngoài làm viền giả thay vì dùng trực tiếp `input` với viền chuẩn, dẫn đến sự không đồng nhất khi focus hoặc hiển thị trên các trình duyệt khác nhau.

## Các thay đổi dự kiến

### 1. Cấu trúc và Giao diện (Frontend)
- **src/routes/auth.tsx**: 
    - Loại bỏ lớp `div` bao ngoài (wrapper) đang làm viền giả trong thành phần `Field`.
    - Chuyển toàn bộ style (chiều cao 56px, bo góc 16px, viền, shadow khi focus) trực tiếp vào thẻ `input`.
    - Đảm bảo `input` sử dụng `w-full` và `h-14` (!h-14) để giữ đúng kích thước thiết kế.
    - Điều chỉnh `padding` (px-5) để text không bị sát viền.

### 2. Kiểm tra và Xác minh (Playwright)
- Tạo kịch bản kiểm tra `scripts/verify-login-ui.py` để:
    - Kiểm tra `bounding_box` của `input` và so sánh với vị trí của text bên trong (nếu có thể đo lường).
    - Chụp ảnh màn hình trạng thái Bình thường và trạng thái Focus để xác nhận viền không bị "bể" hoặc lệch.
    - Đảm bảo không có hiện tượng tràn ngang (horizontal overflow).

## Chi tiết kỹ thuật
- Sử dụng Tailwind classes: `h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/30 px-5 transition-all focus:ring-4 focus:ring-[#0074e2]/10 focus:border-[#0074e2]/40 focus:bg-white outline-none`.
- Loại bỏ logic `focus-within` trên div wrapper vì nó không ổn định bằng focus trực tiếp trên input trong trường hợp này.
