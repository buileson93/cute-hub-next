---
name: T29 — Chuẩn hoá trạng thái đang tải, rỗng và lỗi
description: Tạo component DataState dùng chung và áp dụng cho 5 màn hình chính để cải thiện trải nghiệm người dùng khi đợi dữ liệu hoặc gặp lỗi.
type: feature
---

# T29 — DataState Standardization Plan

## Giai đoạn 1: Khảo sát (Đã hoàn thành)

- Đã tìm thấy: `LoadingState`, `EmptyState`, `ErrorState`, và `Skeletons.tsx`.
- Thống kê: < 20% route có xử lý đủ 3 trạng thái.
- Top 5 màn hình mục tiêu:
  1. `/_app/thiet-bi/` (Sổ lý lịch)
  2. `/_app/he-thong/cay` (Cây hệ thống)
  3. `/_app/su-co/` (Danh sách sự cố)
  4. `/_app/tong-quan` (Tổng quan)
  5. `/_app/bao-tri/` (Danh sách bảo trì)

## Giai đoạn 2: Triển khai

### 1. Tạo component `DataState.tsx`

- Hợp nhất 3 trạng thái vào một component duy nhất.
- Hỗ trợ các kiểu skeleton từ `Skeletons.tsx` (table, list, card, drawer).
- Xử lý logic `empty` thông minh: Phân biệt "không có dữ liệu" và "không tìm thấy kết quả lọc".

### 2. Áp dụng thí điểm (Lượt 1)

- Áp dụng cho màn hình **Sổ lý lịch tài sản** (`src/routes/_app.thiet-bi.index.tsx`).
- Kiểm tra đủ 3 trạng thái: Loading (TableSkeleton), Empty (với nút Xoá lọc), Error (với nút Thử lại).

### 3. Áp dụng cho các màn hình còn lại (Sau khi thí điểm được duyệt)

- Lượt 2: Cây hệ thống.
- Lượt 3: Danh sách sự cố.
- Lượt 4: Tổng quan.
- Lượt 5: Danh sách bảo trì.

## Tiêu chuẩn hoàn thành

- Không còn màn hình trắng khi đang tải (thay bằng Skeleton phù hợp).
- Thông báo lỗi bằng tiếng Việt, có nút Thử lại.
- Trạng thái trống có hướng dẫn hành động tiếp theo.
- Vượt qua kiểm tra `npx tsc --noEmit` và `npm run test`.
