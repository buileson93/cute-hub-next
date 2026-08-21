# Kế hoạch Cải thiện Trang Đăng nhập MIRATS

Hệ thống sẽ rà soát và khắc phục các lỗi về trải nghiệm người dùng (UX) cũng như thẩm mỹ (UI) trên trang đăng nhập `/auth`, đảm bảo tính hiện đại, sắc nét và chuyên nghiệp của phong cách Astryx.

## 1. Rà soát & Khắc phục Lỗi (Audit & Fixes)
- **Lỗi Nút Đăng nhập**: Nút đăng nhập chính (`type="submit"`) đang bị ghi đè màu cứng (`!bg-[#0074e2] !text-white`) và có cấu trúc JSX dư thừa (icon render 2 lần nếu đang loading). Sẽ chuyển về dùng `Button` component chuẩn với variant `default`.
- **Lỗi Nhân bản Nút**: Playwright phát hiện có 2 nút "Đăng nhập" (1 nút Tab và 1 nút Submit) gây nhầm lẫn cho công cụ hỗ trợ tiếp cận (Screen readers). Sẽ đổi tên nút Tab thành "Chọn Đăng nhập" hoặc tương tự.
- **Vấn đề "Language Selector"**: Mặc dù người dùng nhắc đến văn bản này, rà soát mã nguồn không thấy sự hiện diện của nó. Có khả năng đây là một thành phần rác hoặc lỗi từ phiên bản cũ đã bị xóa nhưng còn dư âm trong yêu cầu. Kế hoạch là ĐẢM BẢO không có bất kỳ bộ chọn ngôn ngữ thừa thãi nào trên trang này.
- **Trải nghiệm Mobile**: Đảm bảo các `ResponsiveDialog` hoặc `Sheet` (nếu có) hoạt động mượt mà.

## 2. Nâng cấp Thẩm mỹ (UI Enhancement)
- **Logo & Thương hiệu**: Sử dụng logo `vatm-mirats-full-v2.svg` với tỉ lệ hiển thị cân đối hơn trên nền `card`.
- **Hiệu ứng ATC Tower**: Tối ưu hóa `AtcTowerScene` để làm nổi bật chiều sâu (Ken-Burns effect) và tính chuyên nghiệp của ngành hàng không.
- **Typography**: Áp dụng triệt để thang chữ `TYPO` (7 bậc) đã thiết lập, đặc biệt là `H1` cho tiêu đề và `MONO` cho các thông số kỹ thuật HUD.
- **Màu sắc**: Nhất quán màu `--primary` (MIRATS Blue chuẩn OKLCH) thay vì các mã Hex ngẫu nhiên.
- **Giao diện Card**: Làm mềm các góc bo (`rounded-3xl` -> `rounded-container`), tinh chỉnh shadow và viền tương phản theo chuẩn Astryx Stone.

## Chi tiết kỹ thuật
- Tệp tin ảnh hưởng: `src/routes/auth.tsx`, `src/components/mirats/AtcTowerScene.tsx`.
- Công nghệ: TanStack Start, Tailwind v4, Motion (motion/react).
- RLS & Auth: Đảm bảo logic `markActivityNow()` và `supabase.auth` không bị gián đoạn.

## Các bước thực hiện
1. Tái cấu trúc lại khối `handleSignIn` và `handleSignUp` để xử lý trạng thái loading sạch sẽ hơn.
2. Cập nhật `AuthPage` component: tách biệt rõ ràng vùng Form và vùng Visual.
3. Thay thế các class CSS cứng bằng semantic tokens.
4. Kiểm tra lại bằng `ui:audit` và `mobile:audit` để đảm bảo không vi phạm hợp đồng thiết kế.
