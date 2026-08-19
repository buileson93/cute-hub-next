---
name: Audit vatm.app Deployment
description: Kế hoạch tìm hiểu lý do vì sao publish lên vatm.app không được và sửa lỗi text visual.
type: feature
---

## Bối cảnh
Người dùng báo cáo không thể publish lên tên miền `vatm.app`. Hiện tại, qua kiểm tra sơ bộ, `vatm.app` đang trả về status 200 nhưng cần xác định xem nội dung có đúng là phiên bản mới nhất không và có lỗi runtime nào xảy ra khi truy cập từ domain này không.

## Mục tiêu
1. Tìm hiểu nguyên nhân lỗi publish/truy cập trên `vatm.app`.
2. Thay đổi text visual theo yêu cầu: "language selector" -> "lên kế hoạch tìm hiểu lý do vì sao publish lên vatm.app không được".

## Các bước thực hiện

### 1. Điều tra lỗi vatm.app
- [ ] Sử dụng Playwright để kiểm tra log console và lỗi mạng khi truy cập `https://vatm.app`.
- [ ] Kiểm tra cấu hình DNS và trạng thái domain trong Lovable Dashboard (nếu có thông tin).
- [ ] So sánh mã nguồn hiển thị tại `vatm.app` với bản preview để xem có bị lệch version không.
- [ ] Kiểm tra lỗi SSL hoặc lỗi Mixed Content nếu có.

### 2. Sửa text visual
- [ ] Tìm kiếm text "language selector" (đã search nhưng chưa thấy trong source code, có thể là text trong plan cũ hoặc metadata).
- [ ] Cập nhật text thành "lên kế hoạch tìm hiểu lý do vì sao publish lên vatm.app không được" tại vị trí tương ứng.

### 3. Đề xuất giải pháp
- [ ] Dựa trên kết quả điều tra, đề xuất các bước fix (ví dụ: re-publish, sửa DNS, hoặc fix lỗi code gây crash trên domain chính).

## Chi tiết kỹ thuật
- Tooling: Playwright (Python) để audit runtime.
- Domain: `vatm.app`.
- Preview: `https://id-preview--a8d00423-7e52-4a33-9fc8-a92f23bb5c59.lovable.app`.
