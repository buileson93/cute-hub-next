# Mobile Integrity Guard (U6)

Thiết lập hệ thống giám sát hồi quy cho giao diện Mobile (U6), đảm bảo các chỉ số về khả năng tương thích di động không bị suy giảm (chỉ được phép GIẢM số lỗi).

## Công việc thực hiện

1.  **Cập nhật `scripts/mobile-audit.mjs`**:
    - Tách logic đếm và kiểm tra thành hàm `runMobileAuditLogic` để có thể gọi từ file test.
    - Giữ nguyên khả năng chạy độc lập qua CLI.
2.  **Tạo test hồi quy `src/__tests__/u6-mobile-contract.test.ts`**:
    - **Giám sát chỉ số tĩnh**: Đọc `docs/ui/u6-baseline.json` và so sánh với kết quả hiện tại. Thất bại nếu số lượng "rủi ro chiều rộng" (min-w, fixed width), grid-cols không tiền tố, hoặc đích chạm nhỏ (h-6, h-7, h-8) tăng lên.
    - **Kiểm tra tràn ngang (Horizontal Overflow)**: Sử dụng Playwright để render các trang hạng G1 (lấy từ `docs/ui/phan-hang-mobile.md`) ở chiều rộng 390px. So sánh `scrollWidth` và `clientWidth`.
    - **Kiểm tra DesktopOnly cho hạng G3**: Quét danh sách route hạng G3, đảm bảo mã nguồn có chứa `<DesktopOnly>`. Duy trì một allowlist cho các route chưa kịp bao bọc, allowlist này chỉ được phép ngắn đi.
3.  **Bổ sung chú thích cho `src/components/mirats/DesktopOnly.tsx`**:
    - Thêm comment làm rõ đây là "hàng rào bảo vệ hạng G3".
4.  **Cập nhật `docs/ui/u6-baseline.json`**: Chốt số liệu mốc sau khi dọn dẹp (nếu có).

## Chi tiết kỹ thuật

### Logic kiểm tra tràn ngang

- Sử dụng Playwright vì môi trường Vitest đơn thuần không đo được kích thước thực tế.
- Danh sách URL G1 sẽ được trích xuất tự động từ `docs/ui/phan-hang-mobile.md`.
- Script test sẽ khởi động browser, set viewport 390x844, điều hướng đến từng URL và kiểm tra `document.documentElement.scrollWidth > window.innerWidth`.

### Quy tắc chốt chặn

- `widthRisks` (tổng số lỗi w-[...px] lớn và min-w-[...px]): Chỉ được GIẢM.
- `gridNoPrefix` (grid-cols-[2-9] không có sm:, md:...): Chỉ được GIẢM.
- `smallTouchTargetsRaw` (các class h-6, h-7, h-8): Chỉ được GIẢM.
- `G3DesktopOnly`: Danh sách route G3 thiếu wrapper phải thu hẹp dần.

## Cách kiểm chứng

1.  **Thử nghiệm lỗi**: Thêm một `div` có `min-w-[900px]` vào trang Sự cố (`_app.su-co.index.tsx`). Chạy test -> Test phải ĐỎ.
2.  **Khôi phục**: Xóa `div` đó đi. Chạy test -> Test phải XANH.
3.  **Báo cáo**: Test sẽ log rõ số lượng lỗi trước và sau khi thực hiện task này.
