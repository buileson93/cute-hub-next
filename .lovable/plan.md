# Kế hoạch Triển khai Nền tảng OCR PDF cho MIRATS

Triển khai cấu trúc dữ liệu, mô hình đối tượng và bảo mật cho hệ thống OCR tài liệu mà không làm thay đổi luồng upload hiện tại.

## 1. Cấu trúc Cơ sở dữ liệu (Supabase SQL)

### Bảng `tai_lieu_ocr`
- Tạo bảng `tai_lieu_ocr` với các trường như yêu cầu (id, source_type, source_id, status, full_text, pages jsonb, etc.).
- Ràng buộc `UNIQUE(source_type, source_id)` để đảm bảo mỗi tài liệu chỉ có một bản ghi OCR.
- Khởi tạo RLS (Row Level Security):
    - Chính sách **SELECT**: Kiểm tra quyền truy cập thông qua bảng nguồn (`model_tai_lieu` hoặc `thiet_bi_tep_dinh_kem`).
    - Chính sách **INSERT/UPDATE**: Chỉ dành cho người dùng có quyền quản lý thiết bị/tài liệu tương ứng.
- Tạo Trigger để tự động xóa bản ghi OCR khi tài liệu gốc bị xóa.
- Cấp quyền `GRANT` cho các role `authenticated` và `service_role`.

## 2. Phát triển Module TypeScript

### Định nghĩa Kiểu dữ liệu (`src/lib/mirats/document-ocr/types.ts`)
- Sử dụng Zod để validate cấu trúc `pages` jsonb.
- Interface nghiêm ngặt cho trạng thái (`OcrStatus`) và dữ liệu từng trang (`OcrPageResult`).

### Repository & Logic (`src/lib/mirats/document-ocr/repository.ts`, `status.ts`)
- Triển khai các hàm CRUD: `getOcrResult`, `upsertOcrPending`, `updateOcrSuccess`, `updateOcrError`.
- Logic kiểm tra `file_hash` để quyết định có cần chạy lại OCR hay không.

### Cấu hình & Feature Flags (`src/lib/mirats/document-ocr/config.ts`)
- Tích hợp 3 flags mới vào `src/lib/mirats/feature-flags.ts`: `documentOcrEnabled`, `documentClientIndexEnabled`, `documentOcrExperimentalProvidersEnabled`.

## 3. Kiểm tra & Đảm bảo Chất lượng

### Kiểm tra Hồi quy (Regression Testing)
- Đảm bảo luồng upload PDF cũ không bị gián đoạn.
- Chạy `structural-integrity.test.ts` để xác nhận UI không bị ảnh hưởng bởi các thay đổi backend.

### Kiểm tra Bảo mật
- Xác minh RLS chặn truy cập trái phép vào dữ liệu OCR của tài liệu thuộc đơn vị khác.

## Thông tin kỹ thuật
- **Schema**: `public`.
- **Runtime**: Edge-compatible (createServerFn).
- **Phụ thuộc**: Không thêm thư viện ngoài ở bước này, sử dụng Web APIs và Supabase Client hiện có.
