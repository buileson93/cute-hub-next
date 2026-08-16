# Kế hoạch khắc phục lỗi SSR trên bản Publish (vatm.app)

Lỗi 500 xuất hiện trên vatm.app trong khi Preview vẫn hoạt động thường do sự khác biệt về môi trường thực thi (Worker) và cấu hình biến môi trường (Environment Variables) giữa hai bản.

## Phân tích nguyên nhân dự kiến
1. **Biến môi trường thiếu**: Bản Publish có thể thiếu các biến môi trường quan trọng như `SUPABASE_URL` hoặc `SUPABASE_PUBLISHABLE_KEY` trong context của Worker (không có file `.env` thực tế trên môi trường đã deploy).
2. **Lỗi khi truy cập `process.env`**: Môi trường Worker của Lovable Cloud có thể không hỗ trợ `process.env` theo cách thông thường, cần truy cập qua `globalThis` hoặc tham số `env` của handler.
3. **Lỗi khởi tạo Supabase Client trên Server**: File `src/integrations/supabase/client.ts` hoặc các file middleware có thể đang truy cập biến môi trường tại module scope (ngay khi import), gây crash trước khi ứng dụng bắt đầu chạy.

## Các bước thực hiện

### 1. Củng cố việc truy cập biến môi trường
- Cập nhật `src/integrations/backend/env.ts` để đảm bảo việc phân giải biến môi trường luôn an toàn trên Worker.
- Chuyển việc đọc `process.env` vào bên trong các hàm xử lý thay vì ở cấp độ module để tránh crash khi nạp code.

### 2. Sửa lỗi Supabase Client mặc định
- Kiểm tra và sửa `src/integrations/supabase/client.ts` (nếu có thể can thiệp) hoặc đảm bảo `src/integrations/backend/client.ts` xử lý trường hợp server-side một cách an toàn.

### 3. Cải thiện thông tin chẩn đoán lỗi
- Cập nhật `src/lib/error-page.ts` để hiển thị nhiều thông tin hơn (tên lỗi, stack trace nếu có) thay vì chỉ hiện "Unknown error" khi gặp sự cố nghiêm trọng, giúp việc debug trên prod dễ dàng hơn.

### 4. Kiểm tra và xác thực
- Sử dụng endpoint `/api/public/debug-ssr` trên bản publish để xem lỗi thực tế mà server đang gặp phải.
- Chạy script kiểm tra tự động trên môi trường sandbox giả lập Worker.

## Ghi chú quan trọng
- Tuyệt đối không để lộ thông tin nhạy cảm (secrets) lên giao diện lỗi.
- Ưu tiên tính ổn định: nếu không thể nạp dữ liệu từ server, trang web nên render khung cơ bản (fallback) thay vì hiện trang lỗi 500.
