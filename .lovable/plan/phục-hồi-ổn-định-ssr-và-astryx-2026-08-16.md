# Phục hồi ổn định SSR và Astryx

Người dùng báo cáo lỗi 500 nghiêm trọng xuất hiện sau khi tích hợp thư viện Astryx. Mặc dù đã có các biện pháp bảo vệ SSR (hydration check), hệ thống vẫn không ổn định trên môi trường Worker.

## Phân tích nguyên nhân
1.  **Lỗi nạp module (Top-level ReferenceError)**: Một số thành phần của Astryx hoặc các thư viện phụ trợ (như StyleX runtime) có thể truy cập `window` hoặc `document` ngay khi import, trước khi `AstryxProvider` kịp chạy hydration check.
2.  **Lỗi khởi tạo StyleX**: StyleX yêu cầu cấu hình đặc biệt để chạy ổn định trong môi trường Worker SSR.
3.  **Lỗi vòng lặp Hydration**: Nếu `isHydrated` không đồng bộ chính xác với cây React giữa Server và Client, TanStack Router có thể treo hoặc crash.

## Mục tiêu
- Loại bỏ hoàn toàn lỗi 500 khi SSR.
- Đảm bảo Astryx render an toàn trên cả Server và Client.
- Cải thiện nhật ký lỗi để xác định chính xác vị trí crash trong Astryx.

## Kế hoạch thực hiện

### 1. Tăng cường Shims DOM trong `src/server.ts`
- Bổ sung các global còn thiếu mà Astryx/StyleX có thể yêu cầu (ví dụ: `getComputedStyle`, `matchMedia`).
- Đảm bảo các shim này trả về giá trị hợp lệ nhưng vô hại (inert) để tránh crash khi nạp module.

### 2. Tách biệt nạp Astryx (Lazy Loading)
- Chuyển `AstryxProvider` sang dạng dynamic import hoặc bao bọc kỹ hơn để đảm bảo mã nguồn của nó không được thực thi phía Server nếu không cần thiết.
- Kiểm tra lại `src/routes/__root.tsx` để đảm bảo `AstryxProvider` không gây ra suspension không mong muốn.

### 3. Kiểm soát Environment Variables
- Đảm bảo `resolveServerBackend` không ném lỗi (throw) khi thiếu biến môi trường, mà thay vào đó trả về trạng thái lỗi an toàn để SSR có thể tiếp tục render trang lỗi thân thiện thay vì crash Worker.

### 4. Kiểm thử đặc biệt (Stress Test SSR)
- Chạy script Playwright giả lập môi trường không có JS để kiểm tra xem Server có trả về HTML hoàn chỉnh hay không.

## Chi tiết kỹ thuật
- **File ảnh hưởng**: `src/server.ts`, `src/components/astryx-pilot/AstryxProvider.tsx`, `src/integrations/backend/env.ts`.
- **Nguyên tắc**: "Server phải luôn sống". Nếu Astryx lỗi, Server sẽ fallback về giao diện HTML trần (không style) thay vì chết 500.

