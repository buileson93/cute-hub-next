# Kế hoạch chỉnh sửa văn bản trực quan - Foundation Astryx

## Mục tiêu
Cập nhật nội dung hiển thị trong User Menu để phản ánh giai đoạn "Sửa nền tảng Astryx" (Prompt 1). Thay thế nội dung inventory trước đó bằng danh sách các yêu cầu kỹ thuật về Theme, Provider, và Smoke Test cho nền tảng Astryx.

## Chi tiết thay đổi

### 1. Cập nhật `src/components/mirats/app-shell/index.tsx`
Thay đổi nội dung text bên trong `isInventoryMode` block:
- Tiêu đề: "Sửa nền tảng Astryx trước khi chỉnh bất kỳ màn hình nào."
- Nội dung: Cập nhật toàn bộ checklist kỹ thuật liên quan đến CSS layer, theme source, provider stability và smoke test.

### 2. Kỹ thuật thực hiện
- Sử dụng `code--line_replace` để cập nhật khối văn bản lớn trong `UserMenu`.
- Đảm bảo giữ nguyên cấu trúc `ScrollArea` và `whitespace-pre-wrap` để văn bản hiển thị đúng định dạng.

## Các bước thực hiện
1. Đọc lại file `src/components/mirats/app-shell/index.tsx` để xác định chính xác range dòng cần thay thế (dự kiến từ dòng 140 đến 210).
2. Thực hiện replace content với nội dung mới.
3. Kiểm tra preview để đảm bảo text hiển thị đúng.
