# Khắc phục triệt để lỗi màu sắc (Không cưỡng bức)

Người dùng báo cáo rằng nút "Hoàn tất" vẫn gặp vấn đề về màu sắc (nền xám chữ trắng hoặc mờ nhạt) dù đã cố gắng sửa. Hình ảnh đính kèm cho thấy nút ở trạng thái nền trắng đục và chữ trắng, gây mất tương phản hoàn toàn.

## Nguyên nhân thực sự

Sau khi kiểm tra, tôi phát hiện:

1.  **Biến `bg-primary` và `text-primary` trong Tailwind v4**: Tailwind v4 tự động map các biến `--primary` thành lớp `bg-primary`. Tuy nhiên, các component `Button` của Shadcn sử dụng định nghĩa variant (`default`, `outline`) dựa trên các biến cụ thể như `--primary-foreground`.
2.  **Sự ưu tiên của Radix/Shadcn**: Component `Button` có các thuộc tính mặc định (`hover`, `active`) được định nghĩa trong `buttonVariants`. Nếu `--primary-foreground` không tương phản tốt với `--primary`, hoặc các lớp `bg-primary` bị ghi đè bởi CSS module của Astryx, lỗi sẽ xảy ra.
3.  **Lỗi logic lớp CSS**: Việc sử dụng `bg-white text-primary` trên một nút `variant="default"` (vốn được thiết kế để có nền đậm) gây ra xung đột về thiết kế và khả năng đọc.

## Giải pháp khắc phục triệt để

1.  **Đồng bộ biến Foreground**: Đảm bảo `--primary-foreground` luôn là màu trắng (hoặc cực sáng) để tương phản với `--primary` (xanh MIRATS).
2.  **Chuẩn hóa Component `Button`**: Sử dụng `variant` đúng mục đích thay vì ghi đè màu thủ công bằng `bg-white`. Nút "Hoàn tất" nên là `variant="default"` (nền xanh chữ trắng) và "Cá nhân hóa" nên là `variant="outline"` (nền trắng viền xanh).
3.  **Xử lý Layer Astryx**: Đảm bảo các biến thương hiệu (`astryx-brand`) được áp dụng chính xác cho toàn bộ các token liên quan đến tương tác (`--accent`, `--ring`).

## Các bước thực hiện

- **Bước 1**: Cập nhật `styles.css` để định nghĩa rõ `--primary-foreground` và `--accent` theo mã màu MIRATS.
- **Bước 2**: Sửa logic render nút trong `_app.index.tsx` và `_app.tong-quan.tsx` để sử dụng `variant` chuẩn, không dùng `bg-white` hay `text-primary` thủ công trên nút.
- **Bước 3**: Kiểm tra và đồng bộ lại `StandardTable` và `BulkActionBar` để đảm bảo dùng đúng token.
