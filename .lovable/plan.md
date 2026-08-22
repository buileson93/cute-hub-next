# Kế hoạch Bảo mật Endpoint Công khai (Phase 10B)

Mục tiêu: Thắt chặt bảo mật cho các API endpoint công khai (cron hooks), đảm bảo chỉ các request có secret hợp lệ mới được thực hiện. Loại bỏ hoàn toàn khả năng sử dụng Anon Key để kích hoạt các tác vụ đặc quyền.

## 1. Phân tích & Chuẩn bị
- Xác định 5 endpoint mục tiêu:
  - `src/routes/api/public/hooks/test-email-alerts.ts`
  - `src/routes/api/public/hooks/pm-generate.ts`
  - `src/routes/api/public/hooks/scan-canh-bao.ts`
  - `src/routes/api/public/hooks/r2-cleanup.ts`
  - `src/routes/api/public/hooks/reliability-report.ts`
- Tạo `src/lib/api-auth.server.ts` để dùng chung logic xác thực an toàn (constant-time comparison).
- Kiểm tra các biến môi trường: `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.

## 2. Triển khai Integration Test (RED)
- Tạo `src/routes/api/public/hooks/security.test.ts`.
- Viết các test case mô phỏng:
  - Request không có header auth -> 401/404.
  - Request dùng `SUPABASE_PUBLISHABLE_KEY` (anon key) -> 401.
  - Request dùng sai secret -> 401.
  - Request dùng đúng secret -> 200 (Mock action).
  - Kiểm tra tính nhất quán (idempotency).

## 3. Củng cố Bảo mật Endpoint
Áp dụng logic xác thực cho từng file:

### A. Cấu trúc chung (Boilerplate)
```typescript
const authError = verifySecret(request, "CRON_SECRET");
if (authError) return authError;
```

### B. Xử lý cụ thể từng endpoint
- **test-email-alerts**:
  - Chỉ cho phép gửi tới email trong allowlist (ví dụ domain nội bộ).
  - Vô hiệu hóa mặc định trong môi trường Production.
  - Thêm logic kiểm tra quyền Admin nếu cần.
- **pm-generate**, **scan-canh-bao**, **r2-cleanup**:
  - Yêu cầu `CRON_SECRET`.
  - Loại bỏ fallback dùng anon key.
- **reliability-report**:
  - Sửa lỗi hiện tại đang cho phép dùng anon key.

## 4. Bổ sung Idempotency & Rate Limiting
- Sử dụng header `x-idempotency-key`.
- Kiểm tra trong database (bảng `audit_log` hoặc bảng chuyên dụng) để tránh chạy trùng nghiệp vụ trong khoảng thời gian ngắn.
- Giới hạn tần suất gọi (rate limit) phù hợp với chu kỳ cron.

## 5. Nhật ký & Kiểm tra (Verification)
- Ghi log chi tiết (Endpoint, Request ID, Outcome) nhưng không lộ secret.
- Chạy lại bộ test (GREEN).
- Xóa các file test fixture sau khi hoàn tất.

## Rủi ro & Giải pháp
- **Rủi ro**: Làm gián đoạn các job cron hiện tại đang dùng anon key.
- **Giải pháp**: Cần đảm bảo cập nhật cấu hình `pg_cron` trong database để dùng đúng header `x-cron-secret` trước khi deploy bản fix này (nếu có thể), hoặc cung cấp runbook cập nhật ngay sau deploy.
