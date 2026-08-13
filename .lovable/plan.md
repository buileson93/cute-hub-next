# Kế hoạch Loại bỏ Breadcrumb Redundant — MIRATS 2.0

Người dùng đánh giá các đường dẫn (breadcrumb) trong Top Bar là "thừa thải". Tôi sẽ loại bỏ chúng để giao diện trở nên sạch sẽ hơn.

## Các thay đổi

### 1. Thành phần TopBar
- **File**: `src/components/mirats/app-shell/TopBar.tsx`
- **Thao tác**: 
    - Xoá block `<Breadcrumb>` và wrapper `<DesktopOnly>` xung quanh nó.
    - Xoá logic tính toán `pathSegments` và `breadcrumbs`.
    - Xoá các import không còn sử dụng (`Breadcrumb`, `BreadcrumbItem`, v.v. và `DesktopOnly`).

## Kiểm tra sau khi thực hiện
1. Đảm bảo Top Bar không còn hiển thị breadcrumb.
2. Đảm bảo ô tìm kiếm vẫn hiển thị đúng vị trí.
3. Chạy `npx tsc --noEmit` để kiểm tra lỗi type.
