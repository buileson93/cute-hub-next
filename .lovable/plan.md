# Kế hoạch cập nhật văn bản trực quan - Migration Persistent Frame Astryx

## Mục tiêu
Cập nhật nội dung hiển thị trong User Menu để phản ánh giai đoạn "Migration Persistent Frame MIRATS sang Astryx" (Prompt 2). Thay thế checklist kỹ thuật về nền tảng bằng các yêu cầu về AppShell, Navigation, Responsive Contract và các tiêu chuẩn kiểm thử tương ứng.

## Chi tiết thay đổi

### 1. Cập nhật `src/components/mirats/app-shell/index.tsx`
Thay đổi nội dung text bên trong khối `isInventoryMode`:
- Tiêu đề: "Migration persistent frame MIRATS sang Astryx chính thức, giữ nguyên router và nghiệp vụ."
- Nội dung: Cập nhật checklist về Component sử dụng (Theme, AppShell, Nav), Desktop/Tablet/Mobile Contract, các điều cấm kỵ (KHÔNG ĐƯỢC) và tiêu chuẩn kiểm thử (TEST).

### 2. Kỹ thuật thực hiện
- Sử dụng `code--line_replace` để cập nhật khối văn bản lớn trong `UserMenu`.
- Giữ nguyên cấu trúc `ScrollArea` và định dạng `whitespace-pre-wrap`.

## Các bước thực hiện
1. Đọc lại file `src/components/mirats/app-shell/index.tsx` để xác định chính xác range dòng cần thay thế (dựa trên các thay đổi trước đó, khoảng từ dòng 145 đến 210).
2. Thực hiện replace content với nội dung mới theo Prompt 2.
3. Kiểm tra preview để đảm bảo text hiển thị đúng.
