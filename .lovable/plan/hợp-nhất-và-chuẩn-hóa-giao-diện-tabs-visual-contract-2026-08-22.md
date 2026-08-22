# Hợp nhất và Chuẩn hóa Giao diện Tabs (Visual Contract)

Khắc phục lỗi hiển thị tab "Ma trận quyền" bị trắng nền/trắng chữ và chuẩn hóa các biến thể tab (Segmented & Underline) trên toàn hệ thống MIRATS.

## Các thay đổi chính

### 1. Nâng cấp Primitive Tabs (`src/components/ui/tabs.tsx`)
- Bổ sung variant `segmented` (mặc định) và `underline` vào `TabsList`.
- Chuyển logic màu sắc `active` vào primitive để đảm bảo tính nhất quán giữa nền và chữ.
- **Segmented**: Nền primary, chữ primary-foreground (hoặc tint tương ứng).
- **Underline**: Nền trong suốt, border-bottom primary, chữ foreground hoặc primary.

### 2. Sửa lỗi tại trang Phân quyền (`src/routes/_app.phan-quyen.tsx`)
- Loại bỏ các class override thủ công `data-[state=active]:bg-background`.
- Sử dụng variant `segmented` chuẩn để tự động nhận màu chữ tương phản.

### 3. Chuẩn hóa các route và component khác
- **Underline tabs**: Áp dụng cho `HeThongDetail`, `CongVanPanel`, `EdgeTabs`, `PmPage`.
- **Segmented tabs**: Áp dụng cho `PermissionsPage` (Admin), `ThietBiDetail`.

### 4. Tăng cường trải nghiệm di động
- Đảm bảo `TabsList` có `overflow-x-auto` và không nén nội dung trên màn hình nhỏ.
- Giữ tab đang hoạt động (active) luôn trong vùng nhìn thấy.

## Chi tiết kỹ thuật

### Tokens & Contract
- `segmented`:
  - Active: `bg-primary text-primary-foreground shadow-sm`
  - Inactive: `text-muted-foreground hover:bg-muted/50 hover:text-foreground`
- `underline`:
  - Active: `border-b-2 border-primary text-foreground bg-transparent shadow-none rounded-none`
  - Inactive: `border-b-2 border-transparent text-muted-foreground bg-transparent hover:text-foreground`

### Danh sách file ảnh hưởng
- `src/components/ui/tabs.tsx`: Thêm variant API.
- `src/routes/_app.phan-quyen.tsx`: Xóa override gây lỗi trắng chữ.
- `src/routes/_app.admin.permissions.tsx`: Cập nhật variant.
- `src/routes/_app.he-thong.$id.tsx`: Cập nhật sang underline variant.
- `src/routes/_app.bao-tri.pm.tsx`: Cập nhật sang underline variant.
- `src/components/mirats/EdgeTabs.tsx`: Cập nhật primitive variant.
- `src/components/mirats/congvan/CongVanPanel.tsx`: Cập nhật primitive variant.

## Kế hoạch thực hiện

1. **Phát hiện lỗi**: Viết Playwright test kiểm tra độ tương phản (contrast) của tab active tại trang Phân quyền.
2. **Refactor Primitive**: Cập nhật `tabs.tsx` hỗ trợ `variant="segmented | underline"`.
3. **Áp dụng diện rộng**: Thay thế các class CSS thủ công bằng thuộc tính `variant`.
4. **Kiểm chứng**:
   - Kiểm tra hiển thị Light/Dark mode.
   - Kiểm tra cuộn ngang trên Mobile (390px).
   - Chạy `npm run build` và `npm run typecheck`.

**Kết quả**: Xóa bỏ hoàn toàn tình trạng "trắng trên trắng", giao diện tab chuyên nghiệp và nhất quán theo chuẩn Astryx/MIRATS.
