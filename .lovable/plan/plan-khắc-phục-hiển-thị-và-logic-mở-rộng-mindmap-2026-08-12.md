# Plan - Khắc phục hiển thị và logic mở rộng MindMap

Người dùng phản hồi MindMap vẫn không hiển thị và các node không tự động mở rộng (expand) như trước. Qua kiểm tra kỹ thuật, phát hiện hai vấn đề chính: container chứa React Flow bị mất chiều cao (0px) do cấu trúc flexbox và logic quản lý trạng thái `expanded` trong MindMap đang bị ghi đè không đúng lúc.

## Tình trạng hiện tại
- **Lỗi hiển thị:** `[React Flow]: The parent container needs a width and a height`. Container thực tế có `rfHeight: 0`. Nguyên nhân do `PageBody` có `overflow-auto` và `DataState` có thể đang cản trở việc truyền `flex-1` xuống con.
- **Lỗi Logic Expand:** `CayMindMap` sử dụng `initialExpanded` nhưng `useEffect` đồng bộ có thể đang reset lại trạng thái mở rộng khi dữ liệu `tree` thay đổi nhẹ, hoặc các node mới được thêm vào không được đưa vào tập hợp `expanded`.

## Các bước thực hiện

### 1. Sửa lỗi chiều cao 0px (Fix UI Rendering)
- Cập nhật `src/routes/_app.he-thong.cay.tsx`:
    - Đảm bảo `DataState` truyền thuộc tính `className="flex-1 flex flex-col"` hoặc tương đương để container con chiếm được không gian.
    - Ép chiều cao cụ thể `h-full` cho div chứa `CayMindMap` thay vì chỉ `flex-1` nếu container cha đã có flex định hình.
- Cập nhật `src/components/mirats/DataState.tsx` (nếu cần): Đảm bảo component này không bọc nội dung trong các div làm mất thuộc tính flex của cha.

### 2. Sửa logic mở rộng Node (Fix Expand Logic)
- Cập nhật `src/components/mirats/he-thong-cay/CayMindMap.tsx`:
    - Cải thiện `initialExpanded` để bao quát sâu hơn các cấp độ (PL -> LV -> NH -> HT).
    - Sửa `useEffect` đồng bộ: Chỉ tự động expand khi dữ liệu cây *thực sự* thay đổi cấu trúc lớn (ví dụ: thay đổi số lượng phân loại), tránh reset khi chỉ cập nhật thông tin node.
    - Đảm bảo khi người dùng click vào nút Plus, trạng thái được lưu và không bị `useEffect` khác ghi đè.

### 3. Tối ưu hóa ResizeObserver
- Fix lỗi `ResizeObserver loop completed` bằng cách bọc logic đo đạc nhãn node trong `requestAnimationFrame` hoặc kiểm tra điều kiện kích thước kỹ hơn trong `TruncatedNodeLabel`.

## Kiểm tra
- Mở tab Sơ đồ: Phải thấy các node hiện ra ngay lập tức với đầy đủ cấp độ ít nhất đến Nhóm hệ thống.
- Thử thu nhỏ/mở rộng node: Trạng thái phải được giữ nguyên.
- Kiểm tra Console: Không được còn lỗi "parent container needs width/height".
