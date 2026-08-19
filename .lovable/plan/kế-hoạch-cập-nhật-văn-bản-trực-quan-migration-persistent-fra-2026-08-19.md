# Kế hoạch cập nhật văn bản trực quan - Migration Persistent Frame Astryx (Refined)

## Mục tiêu
Xác nhận và duy trì nội dung hiển thị trong User Menu phản ánh giai đoạn "Migration Persistent Frame MIRATS sang Astryx" (Prompt 2). Đảm bảo nội dung đầy đủ và chính xác theo yêu cầu mới nhất.

## Chi tiết trạng thái hiện tại
- File: `src/components/mirats/app-shell/index.tsx`
- Vị trí: Khối `isInventoryMode` trong `UserMenu`.
- Nội dung: Đã bao gồm các checklist về AppShell, Navigation, Desktop/Tablet/Mobile Contract, và các tiêu chuẩn kiểm thử.

## Các bước thực hiện (Nếu cần cập nhật)
1. Kiểm tra lại nội dung trong `src/components/mirats/app-shell/index.tsx`.
2. Đảm bảo các ký tự đặc biệt như `<=` được xử lý đúng trong JSX (sử dụng `{"<"}=`).
3. Nếu nội dung đã khớp 100% với yêu cầu Prompt 2, tôi sẽ xác nhận hoàn tất.

## Kiểm tra hồi quy
- Đảm bảo `isInventoryMode` (flag `astryxInventoryMode`) vẫn đang bật để người dùng có thể thấy checklist.
- Đảm bảo không có lỗi hydration hoặc lỗi cú pháp JSX.
