# Kế hoạch Triển khai MIRATS 2.0: Giai đoạn G & H - Tối ưu Responsive & Hẹp hóa Giao diện

Dựa trên tài liệu "MA TRẬN THU HẸP GIAO DIỆN THEO MÀN HÌNH", kế hoạch này tập trung vào việc tối ưu hóa trải nghiệm trên thiết bị di động bằng cách ẩn các thành phần không cần thiết và chuyển đổi các thành phần phức tạp sang dạng phù hợp với màn hình nhỏ.

## 1. Mục tiêu & Nguyên tắc (Luật Cao Nhất)

- **Chỉ ẩn thứ KHÔNG CẦN THIẾT**: Dữ liệu và hành động hiện trường (G1) không bao giờ được ẩn.
- **Phân loại G1-G4**:
  - **G1 (Cốt tử)**: Tra cứu QR, Báo sự cố, Góp gạch, Duyệt nhanh -> Giữ và làm tốt hơn (Mobile-first).
  - **G2 (Thu gọn)**: Bảng tài sản, Form chi tiết -> Đổi hình dạng (Thẻ, Sheet, Wizard).
  - **G3 (Công cụ chuyên sâu)**: Sơ đồ mạng, Designer, Canvas -> Ẩn kèm giải thích/nút gửi link.
  - **G4 (Trang trí)**: Pano 360, TzClock trang trí -> Ẩn hẳn.

## 2. Giai đoạn G: Thống nhất cơ chế (Hạ tầng)

- **G.1 Hợp nhất Breakpoint**: Tạo `src/lib/mirats/ui/responsive-scope.ts` để đồng nhất `BP_PX` (từ StandardTable) và `MOBILE_BREAKPOINT` (768px).
- **G.2 Component Cơ sở**:
  - `DesktopOnly`: Hiển thị placeholder/giải thích khi màn hình hẹp thay vì ẩn im lặng.
  - `ResponsiveDialog`: Tự động chuyển `Dialog` (Desktop) thành `Sheet` full-screen (Mobile).
- **G.3 Bảo mật dữ liệu xuất**: Tách luồng Export khỏi luồng hiển thị trong `StandardTable` để tránh lỗi mất cột dữ liệu khi xuất tệp trên Mobile (xác minh Nghi ngờ N29).
- **G.4 Guard Test**: Cập nhật `ui-consistency-guard.test.ts` để bắt buộc các thành phần G3 phải được bọc trong `DesktopOnly`.

## 3. Giai đoạn H: Triển khai diện rộng

- **H.1 Hạng G3 (Công cụ chuyên sâu)**: Áp dụng `DesktopOnly` và `lazy loading` cho 19 tính năng (Sơ đồ mạng, Schema admin, Form designer, v.v.).
- **H.2 Hạng G4 (Trang trí)**: Ẩn các thành phần trang trí (Pano 360, đồng hồ múi giờ không cần thiết).
- **H.3 Rải `hideBelow`**: Cập nhật 33 bảng (`tableKey`) còn lại dựa trên khuôn mẫu `ThanhPhanTable.tsx`.
- **H.4 Mobile-first Forms**: Chuyển đổi `ThietBiFormDialog` sang Wizard chia bước và Sheet toàn màn hình trên mobile.
- **H.5 Card Mode**: Triển khai chế độ hiển thị thẻ (Card) cho 3 bảng chính (Tài sản, Sự cố, Bảo trì) trên màn hình `< sm`.

## 4. Kiểm tra & Xác minh

- **Nghi ngờ N30**: Đo lường tỉ lệ truy cập mobile thật qua `feature_usage_log` để ưu tiên các trang cần tối ưu trước.
- **Nghi ngờ N29**: Thực nghiệm xuất CSV trên màn hình hẹp để đảm bảo không mất dữ liệu.
- **Playwright Test**: Kiểm tra các Sheet/Dialog trên viewport mobile (375px).

---

_Ghi chú: Kế hoạch này sẽ được thực hiện sau khi hệ thống Token màu và View Presets (GĐ 0-1) đã ổn định._
