# Kế hoạch Tối ưu Mật độ hiển thị và Thiết kế Tinh gọn Toàn diện

Người dùng yêu cầu áp dụng ngôn ngữ thiết kế "tinh gọn" (compact) từ trang Hệ thống sang tất cả các giao diện khác để tối ưu mật độ hiển thị và loại bỏ khoảng trắng dư thừa.

## Các khu vực cần tối ưu

### 1. Nâng cấp bộ Token Mật độ (`ui-density.ts`)
- Rà soát và siết chặt các token `compact` cho padding, gap và font-size.
- Đảm bảo các thành phần như KPI, Card Header, và Table Rows đạt độ tinh gọn tối đa.

### 2. Tối ưu trang Nhật ký Sự cố (`_app.su-co.index.tsx`)
- **Dải thống kê:** Chuyển sang dạng thanh công cụ ngang siêu gọn, giảm kích thước font và icon.
- **Bảng dữ liệu:** Chuyển các nút hành động (Chi tiết, Xử lý) sang dạng icon-only có tooltip.
- **Cấu trúc:** Loại bỏ các khoảng đệm không cần thiết giữa header và bảng.

### 3. Tối ưu trang Hỏng hóc và Bảo trì (`_app.hong-hoc.tsx`, `_app.bao-tri.tsx`)
- Áp dụng thiết kế toolbar và bảng tương tự trang Sự cố.
- Thu gọn các bộ lọc (Select, Input) xuống chiều cao tiêu chuẩn `h-7`.

### 4. Tối ưu trang Sổ lý lịch (`_app.thiet-bi.index.tsx`)
- Thu gọn thanh tìm kiếm và các nút trạng thái (Cấp phát, Nghỉ KT).
- Siết chặt khoảng cách giữa các node trong cây phân cấp (`TreeView`).

### 5. Chuẩn hoá giao diện Chung (Sidebar, Shell, PageHeader)
- **Sidebar:** Giảm gap giữa các mục menu khi ở chế độ `compact`.
- **TopBar:** Thu gọn ô tìm kiếm và các icon chức năng.
- **PageHeader:** Đảm bảo không tạo ra khoảng trắng dọc lớn khi không có action/description.

## Chi tiết kỹ thuật

- Sử dụng thuộc tính `density="compact"` cho mọi thành phần `StandardTable`.
- Chuyển đổi các nút `Button` có text sang icon-only bằng `AppTooltip`.
- Sử dụng các class `h-7`, `px-2`, `text-[11px]` cho các control trong thanh công cụ.
- Siết chặt `space-y-x` xuống `space-y-1` hoặc `gap-2` ở các layout chính.
