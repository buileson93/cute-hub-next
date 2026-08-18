# Plan - Tinh chỉnh PowerSearch thon gọn & UX hợp lý

Nâng cấp giao diện PowerSearch sang phong cách tối giản, thon gọn hơn nhưng vẫn đảm bảo đầy đủ chức năng và trải nghiệm người dùng cao cấp.

## User Review Required

> [!IMPORTANT]
> - Chúng ta sẽ giảm chiều rộng từ `56rem` xuống còn khoảng `42rem` (gần với tiêu chuẩn Spotlight của macOS).
> - Cấu trúc 2 cột hiện tại sẽ được thay đổi: chuyển sang 1 cột chính cho kết quả tìm kiếm và 1 bảng thông tin phụ (preview) chỉ xuất hiện khi cần thiết hoặc thu nhỏ lại.

## Proposed Changes

### UI & UX Enhancement
- **Thu gọn kích thước**: Giảm `max-width` của `CommandDialog` để tạo cảm giác tập trung hơn.
- **Tối ưu hóa Header**: Thu nhỏ padding và chiều cao của thanh tìm kiếm, sử dụng icon mảnh hơn.
- **Refactor Tab Bar**: Chuyển Tabs List lên sát thanh tìm kiếm hoặc tích hợp vào một khu vực gọn gàng hơn, giảm khoảng trống thừa.
- **Smart Preview Panel**: Thay vì hiển thị bảng preview rộng 50%, sẽ chuyển sang dạng panel trượt hoặc overlay nhẹ nhàng ở phía bên phải, hoặc chỉ hiển thị thông tin quan trọng nhất ngay dưới dòng kết quả (inline metadata).
- **Typography & Density**: Điều chỉnh lại cỡ chữ (typography) và mật độ (density) để thông tin hiển thị dày đặc nhưng vẫn dễ đọc, đúng tinh thần MIRATS High-density.

### Detailed Component Updates
- `src/components/ui/command.tsx`: Cập nhật `CommandDialog` để hỗ trợ chiều rộng linh hoạt hơn (compact mode).
- `src/components/mirats/search/PowerSearch.tsx`: 
    - Cấu trúc lại `Main Content Area` để ưu tiên không gian cho danh sách kết quả.
    - Cải thiện logic hiển thị `focusedRow` để không làm "vỡ" layout khi bảng thông tin bên phải quá lớn.
    - Làm gọn các `CommandItem`: icon nhỏ hơn, subtitle mảnh hơn.

## Technical Details
- Sử dụng các token `astryx` đã có để đảm bảo tính nhất quán.
- Điều chỉnh `h-[min(80dvh,540px)]` xuống mức hợp lý hơn nếu cần để tránh cảm giác quá dài trên màn hình nhỏ.
- Đảm bảo tính responsive: trên mobile sẽ là giao diện 1 cột hoàn toàn, trên desktop là 1 cột chính + preview mini.

## Success Criteria
- Giao diện nhìn chuyên nghiệp, gọn gàng (Apple-like minimal).
- Không làm mất các tính năng AI Intents hay Deep Links đã phát triển.
- Tốc độ phản hồi và điều hướng vẫn mượt mà.
