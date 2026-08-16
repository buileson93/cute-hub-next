# Kế hoạch chẩn đoán và khắc phục lỗi SSR 500 (Deep Audit)

## Phân tích hiện trạng
Mặc dù đã triển khai các lớp giả lập DOM (Shims) và Hydration Guard, người dùng báo cáo vẫn gặp lỗi "Hệ thống gặp lỗi nghiêm trọng (500)". Điều này chỉ ra rằng lỗi có thể không chỉ nằm ở `AstryxProvider` mà còn ở:

1.  **Lỗi khởi tạo module không đồng bộ**: Có những thư viện khác ngoài Astryx cũng truy cập DOM ngay khi import nhưng chưa được "shim" đầy đủ.
2.  **Lỗi Hydration Mismatch**: Nếu server render ra nội dung quá khác biệt so với client (do thiếu Theme tokens), React có thể throw lỗi trong quá trình hydration.
3.  **Lỗi kết nối Backend trong Worker**: Biến môi trường hoặc logic `Proxy` trong Supabase client có thể gây ra lỗi tuần hoàn (circular) hoặc truy cập thuộc tính không tồn tại trên server.

## Kế hoạch hành động

### 1. Tăng cường Shims (Bổ sung các API còn thiếu)
Bổ sung các API trình duyệt mà các thư viện UI hiện đại thường dùng:
*   `IntersectionObserver`, `ResizeObserver`.
*   `Image`, `Audio`, `Video` constructors.
*   `window.scrollTo`, `window.focus`.

### 2. Cô lập hoàn toàn Astryx trong quá trình SSR
Thay vì render `children` trực tiếp khi chưa hydrate, chúng tôi sẽ render một "Skeleton" hoặc một container rỗng có kích thước tương đương để tránh việc các component con của Astryx cố gắng sử dụng các hooks/tokens khi chưa có Provider thực sự.

### 3. Sửa lỗi Supabase Client trên Server
*   Kiểm tra logic `Proxy` trong `src/integrations/supabase/client.ts` để đảm bảo nó không gây ra lỗi "too much recursion" hoặc ReferenceError khi truy cập `process.env`.
*   Đảm bảo `localStorage` polyfill trả về `null` thay vì `Proxy` cho các key auth để client của Supabase nhận diện đúng trạng thái "chưa đăng nhập" trên server.

### 4. Công cụ chẩn đoán mới
Tạo một server route `/api/public/debug-ssr` để trả về thông tin chi tiết về lỗi cuối cùng xảy ra trên server, giúp chúng tôi không phải đoán qua giao diện 500 chung chung.

### 5. Kiểm thử (Verification)
*   Sử dụng Playwright để chụp ảnh "trước" và "sau" hydration.
*   Chạy `check-ssr-logs.py` phiên bản nâng cấp để bắt mọi `console.error` phát ra từ Worker.

Chúng tôi sẽ thực hiện các bước này ngay lập tức để tìm ra nguyên nhân "thực sự" đằng sau lỗi 500 còn tồn đọng.
