# Kế hoạch Cải thiện và Sửa lỗi Command Palette (PowerSearch)

Khắc phục lỗi điều hướng, mở rộng tính năng để đạt được sự tương đồng đầy đủ với các hệ thống quản trị hiện đại (như VS Code, Linear) và phù hợp với toàn bộ tính năng của website.

## Phân tích lỗi (Audit)
- **Lỗi điều hướng (Critical)**: `handleSelect` trong `PowerSearch.tsx` nhận chuỗi route (vd: `"/thiet-bi"`) từ gợi ý nhưng lại truy cập `res.route`, dẫn đến điều hướng đến `undefined`.
- **Thiếu chức năng**: Hiện tại chỉ hỗ trợ tìm kiếm và 2 gợi ý điều hướng cứng. Chưa có các hành động nhanh (Tạo mới, Quét QR, Đổi theme).
- **Trùng lặp logic**: Sự kiện phím tắt `Ctrl+K` đang được đăng ký ở cả `PowerSearch.tsx` và `TopBar.tsx`.
- **Trải nghiệm người dùng**: Chưa tận dụng hết dữ liệu từ `nav-contract.ts` để cho phép điều hướng nhanh đến mọi ngóc ngách của hệ thống.

## Các bước thực hiện

### 1. Sửa lỗi logic và Hợp nhất sự kiện
- Cập nhật `handleSelect` để xử lý linh hoạt cả đối tượng kết quả tìm kiếm và chuỗi route trực tiếp.
- Chuyển toàn bộ logic lắng nghe `Ctrl+K` về `PowerSearch.tsx` hoặc sử dụng sự kiện `CustomEvent` thống nhất để tránh xung đột.

### 2. Mở rộng Hệ thống Lệnh (Commands)
- **Hành động toàn cục**: Bổ sung nhóm "Hành động nhanh" gồm:
  - Tạo mới (Tài sản, Sự cố, Đợt bảo trì).
  - Công cụ (Quét mã QR, In nhãn hàng loạt).
  - Hệ thống (Đổi giao diện Sáng/Tối, Đăng xuất, Cấu hình cá nhân).
- **Điều hướng thông minh**: Tự động trích xuất toàn bộ danh mục từ `workspaces` trong `nav-contract.ts` để người dùng có thể nhảy đến bất kỳ trang nào bằng cách gõ tên.

### 3. Tối ưu hóa Giao diện (Astryx Style)
- Phân nhóm kết quả rõ ràng: `Hành động`, `Điều hướng`, `Hệ thống`, `Tài liệu (OCR)`.
- Hiển thị phím tắt gợi ý bên cạnh các lệnh quan trọng.
- Đảm bảo hiệu suất tìm kiếm (debounce) và trạng thái tải (loading indicators).

## Chi tiết kỹ thuật
- **File ảnh hưởng**:
  - `src/components/mirats/search/PowerSearch.tsx`: Refactor chính.
  - `src/components/mirats/app-shell/TopBar.tsx`: Đồng bộ logic mở.
  - `src/lib/mirats/nav-contract.ts`: Nguồn dữ liệu điều hướng.

## Kiểm tra hồi quy
- Kiểm tra `Ctrl+K` hoạt động ổn định.
- Kiểm tra điều hướng đến "Danh sách tài sản" từ gợi ý không còn bị lỗi.
- Kiểm tra các lệnh mới (Tạo sự cố, Đổi theme) thực thi đúng hành động.
