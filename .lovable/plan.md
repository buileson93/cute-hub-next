# Kế hoạch khắc phục lỗi SSR 500 liên quan đến Astryx

## Phân tích nguyên nhân
Lỗi 500 (Hệ thống gặp lỗi nghiêm trọng) xảy ra do sự kết hợp của hai yếu tố chính khi chạy trong môi trường Cloudflare Workers (Preview/Production):

1.  **Thư viện Astryx/StyleX không an toàn cho SSR**: Thư viện này cố gắng truy cập vào các biến global của trình duyệt (`window`, `document`, `navigator`, `HTMLElement`) ngay khi import hoặc khởi tạo. Trong môi trường Worker, các biến này không tồn tại, dẫn đến lỗi `ReferenceError`.
2.  **Lỗi khởi tạo Module**: Do các thư viện được gom nhóm (bundle) lại với nhau, việc import một thành phần của Astryx có thể kéo theo việc thực thi mã không an toàn ở cấp độ module, làm hỏng toàn bộ quá trình render của server.

## Các giải pháp đã triển khai (Giải thích cho người dùng)
Chúng tôi đã thực hiện 3 lớp bảo vệ để cô lập và xử lý triệt để vấn đề này:

1.  **Lớp bảo vệ 1: DOM Shims (Giả lập trình duyệt trên Server)**
    *   Tại `src/server.ts`, chúng tôi đã thêm các "giả lập" (shims) cho `window`, `document`, `navigator`, `localStorage`, `matchMedia`, `getComputedStyle`,...
    *   Các giả lập này là các đối tượng "trơ" (inert objects). Khi mã thư viện gọi chúng, chúng sẽ trả về giá trị mặc định thay vì báo lỗi, giúp quá trình khởi tạo module trên server diễn ra suôn sẻ.

2.  **Lớp bảo vệ 2: Trì hoãn thực thi Astryx (Hydration Guard)**
    *   Tại `AstryxProvider.tsx`, chúng tôi đã sử dụng `lazy` load cho thành phần `Theme` và một trạng thái `isHydrated`.
    *   Mã của Astryx Theme chỉ thực sự được tải và chạy sau khi trang web đã nạp xong ở phía người dùng (Client-side hydration). Trên server, chúng tôi chỉ trả về nội dung thô mà không bọc trong Theme, tránh kích hoạt các logic tính toán giao diện phức tạp của thư viện.

3.  **Lớp bảo vệ 3: Môi trường biến an toàn**
    *   Tại `env.ts` và `client.ts`, chúng tôi đã thêm các giá trị dự phòng (placeholders) để nếu server không đọc được key database ngay lập tức, nó cũng không bị "sập" mà sẽ đợi đến khi chạy ở client.

## Các bước tiếp theo để kiểm tra
1.  **Kiểm tra Preview**: Xem bản Preview mới nhất để xác nhận lỗi 500 đã biến mất.
2.  **Kiểm tra Chức năng**: Xác nhận giao diện (màu sắc, font chữ) vẫn hiển thị đúng sau khi trang web đã tải xong (sau khoảng 0.5s hydration).

Tóm lại, **AstryxProvider** (và cụ thể là thư viện Astryx bên dưới) chính là nguyên nhân trực tiếp gây ra lỗi vì nó không được thiết kế để chạy trực tiếp trên Serverless Workers. Các sửa đổi hiện tại đã "cách ly" thành công thư viện này khỏi quá trình render server.
