---
name: Audit and Fix Deployment Issue for vatm.app
description: Điều tra nguyên nhân không thể publish lên vatm.app và lỗi truy cập cuddly-device-core.lovable.app.
type: feature
---

## Bối cảnh
Người dùng báo cáo hai vấn đề nghiêm trọng về triển khai:
1. Không thể publish web lên tên miền tùy chỉnh `vatm.app`.
2. URL publish mặc định `https://cuddly-device-core.lovable.app/` hiện cũng không truy cập được.

Mục tiêu là tìm hiểu nguyên nhân gốc rễ và đưa ra cách khắc phục.

## Mục tiêu
1. Xác định lý do tại sao các URL đã publish không hoạt động hoặc không cập nhật.
2. Kiểm tra cấu hình domain và trạng thái deployment trên hạ tầng Lovable.
3. Cập nhật văn bản visual theo yêu cầu (thay thế "language selector").

## Các bước thực hiện

### 1. Phân tích trạng thái hiện tại (Audit)
- [ ] Kiểm tra tính khả dụng của `https://vatm.app` và `https://cuddly-device-core.lovable.app/` bằng Playwright.
- [ ] Thu thập log console và lỗi mạng (404, 500, SSL, hoặc DNS).
- [ ] Kiểm tra file `src/routes/index.tsx` (hoặc route index thực tế) để đảm bảo không có lỗi runtime làm trắng trang khi build production.
- [ ] Xác minh trạng thái domain `vatm.app` trong thông tin dự án (hiện tại `project_urls` báo là `drifted`).

### 2. Cập nhật văn bản Visual
- [ ] Tìm và thay thế chuỗi "language selector" (nếu tồn tại trong code hoặc metadata/plan) thành: "tìm hiếu nguyên nhân vì sao publish web lên vatm.app không được và cách khắc phục do gì https://cuddly-device-core.lovable.app/ hiện nay cũng không vào được".

### 3. Khắc phục lỗi Deployment
- [ ] Nếu lỗi do "drifted" domain: Hướng dẫn hoặc thực hiện đồng bộ lại cấu hình domain.
- [ ] Nếu lỗi do SSR/Production build: Sửa các lỗi code gây crash trên môi trường production (thường liên quan đến `window` undefined hoặc thiếu biến môi trường).
- [ ] Thử thực hiện lệnh `publish` qua tool nếu cần thiết để kích hoạt lại pipeline.

## Chi tiết kỹ thuật
- **Domain Audit:** Sử dụng Playwright để capture screenshot và network trace từ các domain bị lỗi.
- **SSR Check:** Rà soát các `loader` trong các route chính để đảm bảo tính an toàn SSR.
- **Domain Status:** Kiểm tra kết quả từ `domain_status--check_domain_status` (nếu có quyền).
