# Kế hoạch Đồng bộ Màu sắc Hệ thống (Không cưỡng bức)

Người dùng phát hiện ra việc sử dụng `!important` và mã màu hex cứng (#0074e2) là giải pháp tạm thời ("cưỡng bức"). Mục tiêu là tìm ra nguyên nhân gốc rễ tại sao các component không tự động nhận diện màu xanh MIRATS từ theme và xử lý triệt để thông qua cấu hình hệ thống.

## Nguyên nhân gốc rễ (Phân tích)
1.  **Sự khác biệt giữa Tailwind v4 và Shadcn/Astryx**: Biến `--primary` trong `:root` đã được định nghĩa là màu xanh, nhưng các component (như `Button` của Shadcn) có thể đang sử dụng các lớp CSS hoặc biến nội bộ khác (`--primary-foreground`, `--accent`, v.v.) chưa được ánh xạ hoàn toàn trong `styles.css`.
2.  **Độ ưu tiên của Layer CSS**: Có thể `@astryxdesign/theme-stone` đang ghi đè lại các biến trong `:root` bằng các giá trị xám mặc định của nó sau khi chúng ta định nghĩa.
3.  **Thiếu ánh xạ biến Tailwind**: Tailwind v4 dùng `@theme inline`. Nếu biến `--color-primary` không trỏ chính xác vào `--primary` định nghĩa trong `:root`, màu sắc sẽ bị sai.

## Giải pháp đồng bộ
1.  **Làm sạch `styles.css`**: Đảm bảo định nghĩa màu sắc nằm trong đúng layer và có độ ưu tiên cao hơn theme mặc định của Astryx.
2.  **Đồng bộ biến CSS**: Trỏ tất cả các biến liên quan (`--primary`, `--ring`, `--accent`) về giá trị màu MIRATS chuẩn.
3.  **Gỡ bỏ mã màu hex cứng**: Xóa bỏ hoàn toàn `#0074e2` và `!important` trong toàn bộ codebase, thay bằng các class Tailwind chuẩn (`bg-primary`, `text-primary`).

## Các bước thực hiện
- **Bước 1**: Di chuyển các định nghĩa màu sắc MIRATS trong `styles.css` vào `@layer astryx-brand` hoặc sau khi import theme Astryx để đảm bảo không bị ghi đè.
- **Bước 2**: Kiểm tra lại file `src/lib/mirats/ui/ui-density.ts` và các định nghĩa component chuẩn để đảm bảo chúng dùng biến CSS thay vì giá trị cứng.
- **Bước 3**: Chạy script tìm kiếm và thay thế tự động để gỡ bỏ `!important` và màu hex.

## Kết quả mong đợi
- Giao diện đồng bộ 100% màu xanh MIRATS.
- Code sạch, không có màu hex cứng hay cờ `!important`.
- Hỗ trợ tốt Dark mode mà không cần sửa code component.
