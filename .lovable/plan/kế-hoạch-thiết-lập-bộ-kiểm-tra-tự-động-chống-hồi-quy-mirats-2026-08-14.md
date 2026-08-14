# Kế hoạch Thiết lập Bộ kiểm tra Tự động Chống Hồi quy (MIRATS Integrity Guard)

Bối cảnh: Dự án MIRATS (React + TanStack Router + Supabase) đang gặp vấn đề về các "vết đứt gãy" âm thầm: component mồ côi, handler rỗng, cấu trúc giao diện lắp sai và rụng trường nhập liệu.

## 1. Bảng tóm tắt các phép kiểm

| Mẫu hỏng | Cách phát hiện | Chặn (Merge Block) | Cảnh báo (Warning) | Ước tính vi phạm | Chi phí thời gian |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Giao diện lắp sai (Tabs Mismatch)** | Quét regex đếm `TabsTrigger` vs `TabsContent` trong cùng một tệp. | **Chặn** | | 24 tệp | < 5s |
| **Handler rỗng (Silent Failure)** | Regex tìm handler nghiệp vụ (onSave, onSubmit...) được gán `() => {}`. | **Chặn** (form chính) | **Cảnh báo** (catch/other) | ~30 vị trí | < 10s |
| **Trường nhập liệu bị rụng** | Đối chiếu `buildPayload` / `insert` với danh sách `Input/Select` trong form. | | **Cảnh báo** | ~15 trường | < 20s |
| **Component mồ côi (Orphans)** | Phân tích đồ thị import (Static Analysis) từ các file Route gốc. | | **Cảnh báo** | 13 component | < 60s |

## 2. Chi tiết các phép kiểm

### A. Kiểm tra Tabs Mismatch (Chi phí thấp, Lợi ích cao)
- **Cách phát hiện**: Sử dụng script Node.js quét toàn bộ thư mục `src/routes` và `src/components`. Đếm số lượng chuỗi `<TabsTrigger` và `<TabsContent`. Nếu Trigger > 0 mà Content = 0 (hoặc chênh lệch lớn), báo lỗi.
- **Miễn trừ**: Comment `// integrity-ignore: tabs-managed-externally` (dùng cho trường hợp content nằm ở component con khác).
- **Giảm báo giả**: Chỉ kiểm tra các tệp có chứa `<Tabs`.

### B. Kiểm tra Handler rỗng (Silent Failure)
- **Cách phát hiện**: Tìm các prop của component MIRATS (đặc biệt là trong `quick/`) bắt đầu bằng `on` được gán trực tiếp lambda rỗng. 
- **Miễn trừ**: `// integrity-ignore: optional-handler` kèm lý do (ví dụ: nút chỉ để trang trí hoặc tracking không bắt buộc).
- **Giảm báo giả**: Loại trừ các `.catch(() => {})` vì đây là pattern phổ biến để nuốt lỗi đã xử lý.

### C. Kiểm tra Rụng trường nhập liệu
- **Cách phát hiện**: Quét file form (TSX) để tìm hàm `buildPayload` hoặc `supabase.insert`. Trích xuất các key được ghi. So sánh với các nhãn `Label` hoặc `Input` có trong file. Nếu key có trong payload nhưng không có ô nhập tương ứng, báo lỗi.
- **Miễn trừ**: `// integrity-ignore: auto-generated-field` (dành cho các trường tự sinh như ID, timestamp).
- **Giảm báo giả**: Tập trung vào các file trong `src/components/mirats/quick/` và các trang tạo mới/chỉnh sửa.

### D. Kiểm tra Component mồ côi
- **Cách phát hiện**: Sử dụng `madge` hoặc script quét regex `from "@/components/..."`. Xây dựng tập hợp các file được import. So sánh với danh sách file vật lý trong `src/components`.
- **Miễn trừ**: Khai báo trong tệp `integrity-config.json` dưới mục `whitelistedOrphans`.
- **Giảm báo giả**: Bỏ qua các thư mục `__tests__`, `ui/` (shadcn base), và các file index.

## 3. Lộ trình triển khai

1. **Giai đoạn 1 (Tuần 1)**: Triển khai script **Tabs Mismatch** và **Handler rỗng**. Bật chế độ cảnh báo trong CI.
2. **Giai đoạn 2 (Tuần 2)**: Dọn dẹp 24 lỗi Tabs đã xác định và các handler rỗng quan trọng. Chuyển sang chế độ **Chặn (Block)** cho 2 phép kiểm này.
3. **Giai đoạn 3 (Tuần 3)**: Triển khai **Rụng trường nhập liệu** cho 3 form nghiệp vụ chính. 
4. **Giai đoạn 4 (Hàng tháng)**: Chạy báo cáo **Component mồ côi** để đội phát triển định kỳ rà soát và xoá code thừa.

## 4. Danh sách vi phạm cần dọn dẹp ngay (Ước tính)
1. **Tabs Content thiếu**: `_app.phan-quyen.tsx`, `_app.bao-tri.pm.tsx`, `_app.admin.forms.$id.tsx` (đang dọn dẹp).
2. **Handler rỗng**: `SuCoMoiForm.tsx` (onSuccess), `BaoTriMoiForm.tsx` (onDone).
3. **Trường rụng**: Form sự cố (mất "Tình hình hiện tại", "Nguyên nhân"), Form bảo dưỡng (mất khối trường động).

---
*Lưu ý: Sử dụng `vitest` và `node:fs` có sẵn trong dự án để thực hiện, không thêm thư viện ngoài.*
