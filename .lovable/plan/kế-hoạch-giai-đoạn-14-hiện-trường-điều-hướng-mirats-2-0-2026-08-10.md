# Kế hoạch Giai đoạn 14: Hiện trường & Điều hướng (MIRATS 2.0)

Theo lộ trình từ bản kế hoạch rà soát giao diện, sau khi hoàn tất Giai đoạn 13 (Chi tiết bản ghi & Form), chúng ta sẽ tiến tới **Giai đoạn 14: Hiện trường & Điều hướng**. Giai đoạn này tập trung vào trải nghiệm người dùng trên thiết bị di động (ngoài hiện trường) và tối ưu hóa hệ thống điều hướng toàn cục.

## 1. Mục tiêu

- **StandardTable di động**: Tự động chuyển sang chế độ thẻ (Card mode) thay vì cuộn ngang trên màn hình nhỏ.
- **Màn hình hiện trường (QR Scan)**: Nâng cấp trang quét mã QR thành một trung tâm điều hành hiện trường với các phím bấm lớn.
- **Hỗ trợ ngoại tuyến (Offline)**: Cho phép ghi nháp các tác vụ (sự cố, bảo trì) khi không có mạng và đồng bộ sau.
- **Tối ưu Command Palette**: Phân nhóm kết quả tìm kiếm và bổ sung lịch sử truy cập.
- **Hoàn thiện AppShell**: Tách biệt hoàn toàn các thành phần UI và tập trung cấu hình tại `nav-config.ts`.

## 2. Các bước triển khai

### Bước 1: Chế độ thẻ cho StandardTable trên di động

- Cập nhật `src/components/mirats/StandardTable.tsx`.
- Thêm logic kiểm tra `vw < 768px`.
- Render `display.map` thành danh sách thẻ (`div` với border/shadow) thay vì `TableBody`.
- Mỗi thẻ hiển thị 3-5 trường quan trọng nhất (theo thứ tự `shownCols`).

### Bước 2: Nâng cấp trang Hiện trường (`q.$maThietBi`)

- Refactor `src/routes/q.$maThietBi.tsx`.
- Thiết kế giao diện với:
  - Trạng thái & Vị trí hiện tại của tài sản (chữ lớn).
  - 3 nút hành động lớn (Full width): **Báo sự cố**, **Ghi bảo trì**, **Xem lý lịch**.
  - Cỡ chữ >= 16px, vùng bấm >= 44px để thao tác bằng một tay.
- Tích hợp tham số `embed=1` khi chuyển hướng đến các form tác nghiệp để giữ người dùng trong ngữ cảnh hiện trường.

### Bước 3: Cơ chế ghi nháp Offline (Drafts)

- Tạo hook `useOfflineDraft(key)` sử dụng `localStorage`.
- Tích hợp vào `SuCoMoiForm` và `BaoTriMoiForm`.
- Khi người dùng nhập liệu, tự động lưu vào nháp sau mỗi 2 giây.
- Hiển thị thông báo "Đã lưu nháp" và nút "Khôi phục nháp" khi mở lại form.

### Bước 4: Tinh chỉnh Command Palette (`Cmd + K`)

- Cập nhật `src/components/mirats/CommandPalette.tsx`.
- Phân nhóm kết quả thành: **Trang**, **Tài sản**, **Hệ thống**, **Hành động**.
- Hiển thị 5 mục truy cập gần đây nhất khi ô tìm kiếm trống.
- Bổ sung gợi ý phím tắt (Keyboard shortcuts) cho các hành động phổ biến.

### Bước 5: Củng cố AppShell & Nav Config

- Kiểm tra và di chuyển nốt các logic điều hướng còn sót lại trong `AppShell.tsx` vào `src/lib/mirats/nav/nav-config.ts`.
- Đảm bảo Sidebar, TopBar và MobileNav sử dụng chung một nguồn dữ liệu cấu hình.

## 3. Tiêu chí hoàn thành

- [ ] 100% các bảng dùng `StandardTable` hiển thị tốt trên màn hình 375px (chế độ thẻ).
- [ ] Trang quét QR có các nút bấm lớn, dễ dùng bằng một tay.
- [ ] Form sự cố/bảo trì giữ được dữ liệu khi F5 hoặc mất mạng.
- [ ] Command Palette hiển thị kết quả theo nhóm rõ ràng.

## 4. Giai đoạn tiếp theo (Dự kiến)

- **Giai đoạn 12**: Hợp nhất Dashboard (Tổng quan & Today) thành giao diện điều hành thống nhất.
- **Giai đoạn 10**: Tái cấu trúc Cây hệ thống (tách file 6000 dòng).
