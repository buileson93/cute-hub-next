# Plan: Xử lý Sự cố Bảo mật (Security Incident Response)

Mục tiêu: Loại bỏ hoàn toàn dữ liệu nhạy cảm (private keys, PII, database dumps) khỏi source code, cập nhật cơ chế bảo vệ và chuẩn bị quy trình xoay vòng (rotation) an toàn.

## Các bước thực hiện

### 1. Kiểm tra và Kiểm kê (Inventory)
- [ ] Xác định danh sách các tệp tin trong `supabase/dump/data/` có chứa PII (Email, Họ tên) hoặc Secret (Signing keys).
- [ ] Kiểm tra nội dung `.env` để xác nhận các biến môi trường đang bị track.
- [ ] Tìm kiếm các artifact hoặc script CI/deploy có thể chứa thông tin nhạy cảm.

### 2. Xóa bỏ dữ liệu nhạy cảm
- [ ] Xóa toàn bộ tệp CSV trong `supabase/dump/data/`. Chỉ giữ lại tệp tiêu đề (header-only) nếu cần cho schema scripts hoặc thay thế bằng dữ liệu giả (synthetic data).
- [ ] Xóa tệp `.env` hiện tại khỏi Git (sử dụng `git rm --cached` nếu cần, nhưng trong môi trường này sẽ xóa tệp và đảm bảo không xuất hiện lại).

### 3. Cập nhật cơ chế bảo vệ (Guardrails)
- [ ] Cập nhật `.gitignore` để chặn:
    - `.env` (không chỉ `.env.local`)
    - `supabase/dump/data/*.csv`
    - Các tệp backup (`*.bak`, `*.sql`, `*.dump`)
    - Private keys (`*.pem`, `*.key`)
- [ ] Tạo script `scripts/security-scan.mjs` để quét các mẫu (regex) nhạy cảm:
    - `private_key_b64`
    - `service-role`
    - Email cá nhân trong dump.

### 4. Quy trình xoay vòng (Rotation Runbook)
- [ ] Tạo tài liệu `docs/security/rotation-runbook.md` hướng dẫn chi tiết:
    - Cách tạo signing key mới.
    - Cập nhật secret trong Lovable Cloud / Environment Variables.
    - Xử lý các chữ ký/tài liệu được tạo bằng key cũ (Legacy Verification).
    - Các bước revoke key cũ.

### 5. Xác minh (Verification)
- [ ] Chạy script quét bảo mật vừa tạo với một fixture giả để đảm bảo nó phát hiện được lỗi.
- [ ] Xóa fixture và xác nhận quét thành công (Green).
- [ ] Kiểm tra lại `StandardTable` và các thành phần khác để đảm bảo không bị ảnh hưởng bởi việc xóa dump data (sử dụng dữ liệu mẫu an toàn).

## Chi tiết kỹ thuật
- **Ngôn ngữ**: Tiếng Việt (theo yêu cầu).
- **Công cụ quét**: Regex-based scanner trong Node.js.
- **Tệp bị ảnh hưởng**: `.gitignore`, `.env`, `supabase/dump/data/**`, `docs/security/rotation-runbook.md`.

## Cam kết bảo mật
- KHÔNG in secret/private key ra terminal, log hay chat.
- Chỉ thông báo danh sách các tệp đã thay đổi/xóa.
- Đánh dấu Signing Key cũ là compromised trong runbook.
