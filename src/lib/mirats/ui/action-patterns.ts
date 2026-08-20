---
name: Action Patterns (Typography & Hierarchies)
description: Tiêu chuẩn phân cấp nút bấm và các mẫu hành động chuẩn của MIRATS.
type: design
---
# Action Patterns & Hierarchies

Tài liệu này định nghĩa cách sử dụng các biến thể (variant) của Button để thiết lập phân cấp thị giác rõ ràng, giúp người dùng nhận diện hành động chính.

## 1. Nguyên tắc "Duy nhất Nút chính" (One-Default Rule)
Mỗi khung nhìn (Page, Dialog, Section) chỉ được phép có **DUY NHẤT MỘT** nút sử dụng `variant="default"`. 

- **Tiết kiệm sự chú ý**: Tránh tình trạng nhiều nút cùng "hét lên" đòi sự chú ý.
- **Dẫn dắt hành động**: Nút chính phải là hành động mang lại giá trị cao nhất hoặc là bước tiếp theo tự nhiên của quy trình.

## 2. Phân cấp biến thể (Button Variants Hierarchy)
Thứ tự ưu tiên từ cao xuống thấp:

1.  **DEFAULT (`variant="default"`)**: Hành động chính (Primary Action). Dùng cho "Thêm mới", "Lưu", "Xác nhận".
2.  **OUTLINE (`variant="outline"`)**: Hành động phụ (Secondary Action). Dùng cho "Hủy", "Quay lại", "Xuất file", hoặc các lệnh không thay đổi trạng thái ngay lập tức.
3.  **GHOST (`variant="ghost"`)**: Công cụ (Tool/Utility). Dùng trong Toolbar, Menu ngữ cảnh, hoặc các hành động lặp lại (Edit/Delete trên từng dòng).
4.  **LINK (`variant="link"`)**: Điều hướng trong văn bản. Dùng để xem chi tiết hoặc liên kết đến trang khác từ trong mô tả.
5.  **DESTRUCTIVE (`variant="destructive"`)**: Chỉ dùng cho các hành động xóa không thể hoàn tác và **bắt buộc** phải đi kèm `ConfirmDialog`.

## 3. Các mẫu hành động chuẩn (Fixed Patterns)

| Vùng (Scope) | Mẫu (Pattern) | Ghi chú |
| :--- | :--- | :--- |
| **Page Header (Toolbar)** | `variant="ghost"` | Các icon-only button như Search, Settings, Help. |
| **Page Header (Actions)** | 1 `default` + N `outline` | Ví dụ: "Thêm tài sản" (default), "Lọc" (outline). |
| **Bulk Actions** | `variant="outline"` | Các hành động hàng loạt thường dùng outline để tránh lấn át nút chính. |
| **Empty State** | `variant="default"` | Nút hành động duy nhất để bắt đầu. |
| **Table Actions (Row)** | `variant="ghost"` | Edit, Delete, Info trên từng dòng. |
