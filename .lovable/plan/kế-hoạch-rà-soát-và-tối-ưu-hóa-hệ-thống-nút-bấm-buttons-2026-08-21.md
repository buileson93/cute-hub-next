# Kế hoạch Rà soát và Tối ưu hóa Hệ thống Nút bấm (Buttons)

Người dùng báo cáo tình trạng các nút bấm có văn bản (như "Cá nhân hóa", "Thêm Widget") đang gặp vấn đề: bị "cụt", thiếu nội dung text và kích cỡ quá bé. Trong khi đó, các nút chỉ có icon (icon-only) được đánh giá là bình thường. Kế hoạch này tập trung vào việc sửa đổi logic hiển thị văn bản và kích thước của các nút có nhãn (labeled buttons) để đảm bảo không gian hiển thị đầy đủ và dễ đọc.

## Các vấn đề cần giải quyết
- Nút bấm có văn bản bị cắt (cụt) hoặc quá hẹp, không đủ không gian cho text.
- Kích thước font chữ của text bên trong nút quá nhỏ ở một số chế độ mật độ.
- Sự khác biệt về cảm quan giữa nút icon-only (ổn) và nút có text (lỗi).

## Chi tiết kỹ thuật

### 1. Cấu trúc lại Component Button (`src/components/ui/button.tsx`)
- Điều chỉnh `renderContent` để ưu tiên không gian cho `children` (text) khi không phải là `size="icon"`.
- Cập nhật `buttonVariants` cho các size `default`, `sm`, `xs`:
    - Tăng `min-width` hoặc `padding-x` cho các nút có text để tránh cảm giác bị "cụt".
    - Điều chỉnh font-size desktop cho các nút có text: `default` (13-14px), `sm` (12px), `xs` (11px).
- Đảm bảo `gap` giữa icon và text đủ lớn (`gap-2`) và không bị bóp nghẹt.

### 2. Tinh chỉnh Token Mật độ (`src/lib/mirats/ui/ui-density.ts`)
- Tăng nhẹ `CONTROL_PX` (padding ngang) cho các nút có text ở chế độ Desktop.
- Đảm bảo `CONTROL_FS` (font size) cho text trong control không thấp hơn 12px trừ khi ở size siêu nhỏ.

### 3. Sửa lỗi cụ thể trên Dashboard Toolbar (`src/routes/_app.index.tsx`)
- Kiểm tra lại các nút "Thêm Widget", "Khôi phục", "Cá nhân hóa".
- Loại bỏ các giới hạn chiều rộng cứng (nếu có) hoặc `overflow-hidden` gây cắt chữ.
- Sử dụng `whitespace-nowrap` một cách cẩn thận để đảm bảo text không bị xuống dòng nhưng vẫn đủ chỗ hiển thị.

### 4. Rà soát Table Toolbar và Action Buttons
- Kiểm tra các nút hành động trong bảng và thanh công cụ của các trang danh sách.
- Đảm bảo các nút "Lưu", "Hủy", "Xuất file" hiển thị đầy đủ nhãn.

## Kế hoạch xác minh
- **Visual Audit**: So sánh trực quan giữa nút icon-only và nút labeled để đảm bảo sự cân đối.
- **Density Scaling**: Kiểm tra khả năng co giãn của text khi chuyển đổi giữa Compact/Comfortable/Spacious.
- **Edge Case Check**: Kiểm tra các nút có văn bản tiếng Việt dài (như "Khôi phục mặc định") xem có bị tràn hay cắt không.

