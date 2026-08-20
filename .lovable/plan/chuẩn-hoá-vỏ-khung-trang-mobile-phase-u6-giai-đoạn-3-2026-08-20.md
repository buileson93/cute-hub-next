# Chuẩn hoá vỏ khung trang Mobile (Phase U6 - Giai đoạn 3)

Chuẩn hoá thanh trên, vùng ngữ cảnh, vùng an toàn và dọn dẹp các hằng số cứng trong AppShell.

## 1. Khai báo hằng số (ui-density.ts)
- `MOBILE_NAV_TOTAL_H`: Dùng để tính toán `pb` cho main content và vị trí `bottom` của `BulkActionBar`.
- `SAFE_AREA_BOTTOM`: Biểu thức env an toàn.

## 2. Đồng bộ AppShell.tsx
- Thay `pb-16` bằng biến động dựa trên `MOBILE_NAV_TOTAL_H`.
- Đảm bảo `main` content luôn đủ khoảng trống cho `MobileNav`.

## 3. Cải tiến PageHeader.tsx (Mobile Sticky)
- Tiêu đề rút gọn (`truncate`) trên 1 dòng.
- Vùng ngữ cảnh (actions/filters) sẽ `sticky` ngay dưới `TopBar`.
- Gom nhóm các hành động phụ vào menu "ba chấm", chỉ để lại 1 hành động chính.

## 4. BulkActionBar.tsx
- Điều chỉnh `bottom` để nổi phía trên `MobileNav`.
- Tích hợp `safe-area-inset-bottom` vào tính toán vị trí.

## 5. Kiểm tra hồi quy
- Chạy `npm test` cho Sidebar.
- Kiểm tra trực quan trên các kích thước màn hình phổ biến (390x844, 360x800).
