# Kế hoạch: Secure API Key & Extension Boundary (Phase 10D)

Mục tiêu: Đảm bảo API Key chỉ có quyền truy cập vào Project/Task được chỉ định, thực thi chính sách bảo mật actor-based scopes, và ngăn chặn cross-project data leakage.

## 1. Kiểm toán & Tái hiện (Red Tests)
- Tạo `src/lib/mirats/auth/__tests__/api-key-security.test.ts` để kiểm tra các kịch bản xâm nhập:
    - User A dùng key của mình để ghi công văn vào Project của User B (Mong đợi: 403/404).
    - API key thiếu scope `project_correspondence:write` gọi endpoint công văn (Mong đợi: 403).
    - Gửi `assigned_task_id` thuộc project khác project_id trong request (Mong đợi: 400/404).
    - Idempotency key của User A trùng với User B (Mong đợi: Không va chạm, ghi mới bình thường).
    - Sử dụng key đã bị thu hồi (revoked) hoặc hết hạn (expired) (Mong đợi: 401).
    - Thiếu `MIRATS_API_PEPPER` trong môi trường (Mong đợi: Fail closed).

## 2. Nâng cấp Authentication & Authorization (API Keys)
- **Quản lý Quyền tạo Key:** Cập nhật `createApiKey` trong `api-keys.functions.ts` để kiểm tra role (Admin/Manager) hoặc permission cụ thể thay vì chỉ kiểm tra `userId`.
- **Thực thi Pepper:** Yêu cầu `MIRATS_API_PEPPER` phải có giá trị thực trong production. Nếu là "default-pepper-change-me", trả về lỗi bảo mật khi khởi động hoặc gọi hàm.
- **Audit Logs:** Đảm bảo mọi lần sử dụng (thành công/thất bại) đều được log IP (hashed) và Actor ID, nhưng tuyệt đối không log secret hoặc pepper.

## 3. Bảo mật Endpoint Công văn (`cong-van.ts`)
- **Actor Project Scoping:** Thay vì chỉ kiểm tra project có tồn tại không, phải kiểm tra xem `user_id` sở hữu API Key có quyền truy cập (membership) vào Project đó không.
- **Task Verification:** Xác minh `assigned_task_id` thuộc về `project_id` được gửi trong request.
- **Idempotency Scoping:** Cập nhật logic idempotency để check cặp `(user_id, project_id, idempotency_key)` thay vì chỉ mỗi key đơn thuần.
- **Hardening CORS:** Giới hạn `Access-Control-Allow-Origin` cho extension ID cụ thể hoặc domain được cấu hình (nếu có thể), thay vì `*`.

## 4. Database & Policy (Supabase)
- Cập nhật RLS cho `api_keys`:
    - Chỉ cho phép `service_role` (hệ thống) đọc secret_hash để verify.
    - User chỉ nhìn thấy metadata (name, key_id, scopes) của key mình sở hữu.
- Thêm unique constraint cho idempotency nếu cần: `UNIQUE (user_id, project_id, idempotency_key)`.
- Cập nhật hoặc thêm migration để lưu trữ mapping actor/project quyền hạn nếu chưa đủ.

## 5. Xác minh & Bàn giao
- Chạy toàn bộ integration tests.
- Kiểm tra rate-limit theo key ID/IP.
- Lập kế hoạch rotate (thu hồi & cấp mới) cho các key cũ tạo bằng default pepper.

## Kỹ thuật
- Sử dụng `timingSafeEqual` cho mọi so sánh hash/secret.
- Fail-closed: Bất kỳ lỗi cấu hình hoặc thiếu biến môi trường nhạy cảm đều dẫn đến từ chối dịch vụ (401/404).
- Cấu trúc thư mục:
    - `src/lib/mirats/auth/api-keys.functions.ts` (Logic lõi)
    - `src/routes/api/public/ext/cong-van.ts` (Public entry point)
    - `src/lib/mirats/auth/__tests__/api-key-security.test.ts` (Test bảo mật)
