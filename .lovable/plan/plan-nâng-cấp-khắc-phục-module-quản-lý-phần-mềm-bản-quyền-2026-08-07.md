# Plan - Nâng cấp & Khắc phục module Quản lý phần mềm bản quyền

Nâng cấp module Quản lý bản quyền theo hướng an toàn, chính xác và chuyên nghiệp hơn, bám sát các tiêu chuẩn dự án và khắc phục các lỗi nghiêm trọng đã được review.

## Phase 1: Khắc phục lỗi nghiêm trọng & Bảo mật (Critical & High)

### 1. Database Migration

- **Bảo mật RLS**: Cập nhật policy `pmbq_read_scope` để loại bỏ việc cho phép đọc khi `don_vi_id IS NULL` đối với người dùng thông thường (chỉ cho phép `can_manage_equipment` hoặc đúng đơn vị).
- **Ngăn chặn vượt ghế (Race Condition)**: Cập nhật hàm trigger `pmbq_check_seats` sử dụng `SELECT ... FOR UPDATE` trên bảng `phan_mem_ban_quyen` để khóa hàng trước khi kiểm tra số ghế, đảm bảo tính nguyên tử khi nhiều giao dịch cấp phát diễn ra đồng thời.
- **Tự động sinh mã**: Thêm logic mặc định hoặc trigger để tự động sinh `ma_ban_quyen` theo định dạng `BQ_XXXXXXXX` nếu không nhập, tránh lỗi UNIQUE khó hiểu cho người dùng.

### 2. Sửa lỗi cấp phát từ trang thiết bị

- **BanQuyenCapPhatDialog.tsx**:
  - Xử lý trường hợp `banQuyen={null}`: Hiển thị thêm một `Combobox` để chọn bản quyền (chỉ hiện các bản quyền còn ghế) khi dialog được mở mà chưa chọn sẵn phần mềm.
  - Cập nhật `useThietBiOptions`: Chuyển sang lọc phía server (server-side filtering) theo `la_may_tinh=true` và hỗ trợ tìm kiếm theo từ khóa thay vì tải toàn bộ 2000 bản ghi về client.
- **ThietBiBanQuyen.tsx**: Cập nhật để phối hợp với logic mới của dialog.

## Phase 2: Hoàn thiện tính năng & Chuẩn hóa (Medium)

### 1. Trang chi tiết & Tệp đính kèm

- **Route chi tiết**: Tạo route `src/routes/_app.phan-mem-ban-quyen.$ma.tsx` hiển thị thông tin chi tiết, tab Cấp phát, tab Tệp và Lịch sử.
- **Quản lý tệp**: Triển khai tab Tệp sử dụng `DocViewerDialog` và bảng `phan_mem_ban_quyen_tep` đã có sẵn.

### 2. Cảnh báo & Bảo mật License Key

- **Cảnh báo hết hạn**: Kết nối logic kiểm tra hết hạn vào hệ thống `canh_bao_het_han_log` để gửi thông báo email/Telegram theo các mốc 60/30/7 ngày.
- **Bảo mật License Key**:
  - Mặc định mask license key trên UI (VD: `XXXX-XXXX-1234`).
  - Thêm nút "Hiện Key" yêu cầu quyền quản lý và ghi lại nhật ký kiểm toán (audit log) mỗi khi có người xem key.

### 3. Phân quyền & Kiểm thử

- **PermGate**: Chuyển các kiểm tra `hasRole` hardcode sang sử dụng `PermGate` với module `ban_quyen` trong bảng `role_permission`.
- **Unit Test**: Bổ sung `vitest` cho các hàm logic trong `ban-quyen.ts` (tính ngày còn lại, trạng thái, số ghế).

## Phase 3: Dọn dẹp (Ponytail Cleanup)

### 1. Tối ưu mã nguồn

- **src/routes/\_app.phan-mem-ban-quyen.tsx**:
  - Xóa hàm `cn()` cục bộ, sử dụng `cn` từ `@/lib/utils`.
  - Thay thế donut SVG tự vẽ bằng `Progress` component chuẩn hoặc Recharts nếu cần thiết.
  - Loại bỏ các tooltip/badge trang trí không phục vụ việc ra quyết định để làm gọn bảng.
- **Refactor Hooks**: Gộp logic từ `ban-quyen-thiet-bi.ts` vào `ban-quyen.ts`, chuẩn hóa kiểu dữ liệu, loại bỏ ép kiểu `as any`.
- **Sử dụng RPC**: Chuyển việc tính toán KPI ở client sang gọi RPC `ban_quyen_tong_hop()` đã được viết ở DB.

## Verification Plan

### Automated Tests

- Chạy `npm test` để kiểm tra các unit test mới cho logic bản quyền.
- Verify các policy RLS bằng SQL query kiểm tra quyền truy cập của các role khác nhau.

### Manual Smoke Test (Playwright)

1. **Cấp phát từ thiết bị**: Mở chi tiết một máy tính -> tab Phần mềm -> Cấp phát bản quyền -> Chọn phần mềm -> Kiểm tra danh sách cập nhật.
2. **Kiểm tra RLS**: Đăng nhập tài khoản user thường -> Kiểm tra không thấy bản quyền của đơn vị khác hoặc bản quyền không thuộc đơn vị mình (nếu không phải manager).
3. **Chặn vượt ghế**: Thử cấp phát vượt quá số ghế quy định -> Kiểm tra thông báo lỗi từ database trigger.
4. **Xem License Key**: Nhấn "Hiện Key" -> Kiểm tra log ghi lại hành động.
