---
name: T48 — Dashboard Restoration
description: Dựng lại trang chủ thành trung tâm điều hành với các khối chỉ số bấm được, biểu đồ lớn và khu vực cá nhân hóa.
type: feature
---

# Kế hoạch dựng lại Trang chủ (T48)

## Giai đoạn 1: Chuẩn bị & Dọn dẹp
- Cập nhật `PageHeader` để hiển thị lời chào theo giờ (Sáng/Chiều/Tối) và lấy `profile.ho_ten` từ `useSession`.
- Gỡ bỏ khối "Bản tin vận hành" rỗng.
- Khởi tạo các truy vấn cần thiết (tối đa 8): `completeness`, `v_menu_badges`, `dashboard_brief_today`, `dashboard_activity_feed`, `nhiem_vu_nhap_lieu`.

## Giai đoạn 2: Dựng Tầng 2 — Ba khối câu hỏi
- **Khối A (Ưu tiên cao): "Hôm nay có gì đang cháy"**
  - Con số: Tổng `su_co_mo` + `hong_hoc_mo` (từ `v_menu_badges`).
  - Danh sách: 3 sự cố/hỏng hóc mới nhất kèm link.
  - So sánh: Tăng/giảm so với tuần trước (từ `dashboard_health`).
- **Khối B: "Tuần này phải làm gì"**
  - Con số: `pm_den_han` + `sap_het_han` (từ `dashboard_kpis`).
  - Danh sách: 3 PM sắp đến hạn hoặc giấy phép sắp hết hạn.
- **Khối C: "Dữ liệu có sạch không"**
  - Con số: `% Hoàn thiện` trung bình.
  - Danh sách: 3 tài sản có điểm thấp nhất cần bổ sung (từ `getCompletenessOverview`).

## Giai đoạn 3: Dựng Tầng 4 — Biểu đồ duy nhất (Large)
- Tái sử dụng thành phần `BarChart` từ `tong-quan.tsx`.
- Thêm Tabs chuyển đổi: "Xu hướng sự cố", "Độ khả dụng", "Trạng thái tài sản".
- Lưu lựa chọn Tab của người dùng qua `useUserPref("dashboard:main-chart-tab", "trend")`.

## Giai đoạn 4: Dựng Tầng 5 — Khu vực cá nhân & Mobile
- **Khu vực của tôi**: Hiển thị nhiệm vụ nhập liệu được giao và điểm đóng góp cá nhân.
- **Dòng thời gian**: Hiển thị 5 mục gần nhất từ `audit_log` (của chính user).
- **Responsive**: Ẩn Tầng 4 trên mobile, chuyển các khối Tầng 2 thành Stack dọc.

## Kiểm tra & Hoàn thiện
- Đếm số lượng truy vấn (đảm bảo <= 8).
- Kiểm tra trạng thái Skeleton, Error, Empty (viết theo hướng tích cực).
- Chạy `npx tsc --noEmit` và `npm run test`.
