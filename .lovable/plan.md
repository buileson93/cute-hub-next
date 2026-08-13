---
name: Tinh gọn Giao diện (Compact UI & Interaction)
description: Kế hoạch 5 bước chuẩn hoá mật độ giao diện và hệ tương tác MIRATS 2.0 theo phong cách SnowUI.
type: design
---

# Kế hoạch Tinh gọn Giao diện — MIRATS 2.0

## BỐI CẢNH
Giao diện hiện tại cần được tối ưu để "nhẹ và sạch" như mẫu SnowUI nhưng phải giữ nguyên bảng màu thương hiệu VATM và các trạng thái nghiệp vụ. Đây là công việc thuần trình bày, không can thiệp vào logic dữ liệu.

## THỨ TỰ TRIỂN KHAI BẮT BUỘC (Mỗi bước 1 commit)

### 1. Token mật độ (ui-density.ts & styles.css)
- **Mục tiêu**: Thiết lập nguồn sự thật duy nhất cho kích thước.
- **Thay đổi**:
  - `PAGE_PADDING`: p-3 md:p-4 (compact).
  - `SECTION_GAP`: gap-3.
  - `TABLE_ROW_H`: h-9 (36px).
  - `CONTROL_H`: h-8 (32px).
  - `TEXT_BODY`: 13px.
  - Hợp nhất các biến `--radius` (Card 16px, Control 8px).

### 2. Sidebar và Khung điều hướng (AppShell, Sidebar)
- **Mục tiêu**: Tối ưu diện tích điều hướng.
- **Thay đổi**:
  - Rail: Rộng 56px, Item cao 44px, dùng Tooltip thay nhãn chữ.
  - Sidebar: Rộng 208px, Item cao 32px, chữ 13px.
  - Header sidebar cao cố định 48px.

### 3. Top bar và PageHeader
- **Mục tiêu**: Giảm chiều cao chiếm dụng đầu trang.
- **Thay đổi**:
  - Top bar: Cao 48px, ô tìm kiếm 32px bo tròn.
  - Gộp Breadcrumb vào Top bar.
  - PageHeader: Cao 40px, gộp ActionBar vào cùng hàng.
  - Chuyển description dài sang Tooltip InfoHint.

### 4. Card, KPI và Bảng (StandardTable, KpiCard)
- **Mục tiêu**: Tăng mật độ thông tin hiển thị.
- **Thay đổi**:
  - KPI Card: Cao 96-104px, bố cục ngang, padding 16px.
  - Bảng: Dòng 36px, padding dọc 6px, bỏ sọc xen kẽ, header dính (sticky).
  - Biểu đồ: Giới hạn cao 200-240px.

### 5. Màu và Bo góc (Global Styles)
- **Mục tiêu**: Hoàn thiện cảm giác "sạch".
- **Thay đổi**:
  - Viền nhạt (8% tương phản).
  - Loại bỏ bóng đổ nặng, thay bằng nền `muted`.
  - Nút chính dùng nền primary nhạt cho hover.
  - Chuẩn hoá hệ tương tác (scale 0.98 khi active, duration 120ms).

## RÀNG BUỘC TUYỆT ĐỐI
- **KHÔNG** sửa query, mutation, RPC, router hoặc schema.
- **KHÔNG** đụng vào các phần đang phục hồi: Cây, Mindmap, Edit Mode, Chi tiết tài sản.
- **GIỮ NGUYÊN** màu trạng thái (khai thác, hỏng, sửa chữa...).

## BỘ NGHIỆM THU
1. **Build & Typecheck**: `npx tsc --noEmit` và `npm run build` thành công.
2. **Visual Audit**: Chụp ảnh so sánh tại 1440px và 390px (mobile).
3. **Density Check**: 
   - Bảng hiển thị thêm ~25% số dòng trên cùng một màn hình.
   - Vùng đầu trang giảm ~40px chiều cao.
4. **Accessibility**: Kiểm tra focus ring và tương phản chữ (đạt 4.5:1).
