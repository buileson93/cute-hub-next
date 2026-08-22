# Phase 10J: UI Contract & Primitive Ownership

Khôi phục tính toàn vẹn của giao diện thông qua xác định rõ quyền sở hữu kiểu dáng, di chuyển các điều khiển raw sang chuẩn component, và thực thi các tiêu chuẩn về trợ năng (A11y).

## Người dùng không rành kỹ thuật (User-facing)
- **Chuẩn hóa giao diện**: Đảm bảo các nút bấm, ô nhập liệu và bảng dữ liệu hiển thị đồng nhất trên mọi kích thước màn hình (Mobile/Desktop).
- **Cải thiện khả năng truy cập**: Mọi icon đều có nhãn hướng dẫn cho người khiếm thị và hỗ trợ tốt hơn cho việc điều khiển bằng bàn phím/cảm ứng.
- **Trải nghiệm người dùng**: Thêm chế độ hiển thị dạng Lưới (Grid) cho danh sách thiết bị bên cạnh dạng Bảng truyền thống.

## Chi tiết kỹ thuật (Technical details)
- **Style Ownership**: Loại bỏ các bộ chọn CSS toàn cục cho `table`, `th`, `td`. Chuyển sang sử dụng các class semantic của Astryx (`astryx-table-*`) và Tailwind utility.
- **Primitive Hardening**: Refactor `src/components/ui/button.tsx` để xóa code loading cũ, thống nhất token giữa Tailwind và Astryx.
- **A11y Audit**: Thực thi `aria-label` cho toàn bộ icon-only buttons trong route `/danh-muc/thiet-bi`.
- **Responsive Inventory**: 
  - Triển khai `viewMode` ("table" | "grid") lưu trong `localStorage`.
  - Sử dụng `ResponsiveDialog` (Sheet trên mobile) cho các form tác vụ.
- **Security Hardening**:
  - Bảo mật endpoint `/api/public/inventory-cron` bằng `verifyApiSecret`.
  - Chuyển `StatusBadge` sang domain-driven props.

## Các bước thực hiện
1. **Visual Fixtures**: Cập nhật `src/components/mirats/TzClock.tsx` với text contract Phase 10J.
2. **Button Migration**: Rà soát và thay thế thẻ `<button>` thô bằng `Button` component chuẩn.
3. **Table Scoping**: Di chuyển style table từ global `styles.css` vào component-level classes.
4. **Grid View Implementation**: Hoàn thiện UI Grid cho danh sách thiết bị với adaptive layout.
5. **Accessibility Fixes**: Bổ sung nhãn cho các bộ lọc và hành động hàng loạt.
