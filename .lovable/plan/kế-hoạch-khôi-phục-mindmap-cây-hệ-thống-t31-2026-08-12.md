# Kế hoạch khôi phục MindMap Cây Hệ Thống (T31)

Người dùng báo cáo không tìm thấy giao diện MindMap hoặc MindMap không hiển thị đúng sau khi hoàn thành Task T31 trước đó. Cần kiểm tra lại và đảm bảo tính năng này hoạt động ổn định, dễ tiếp cận.

## Tình trạng hiện tại
- Route `/he-thong/cay` đã có tab "Sơ đồ" (MindMap).
- Component `CayMindMap.tsx` sử dụng `@xyflow/react` đã được triển khai nhưng có thể gặp lỗi về tọa độ hoặc viewport khiến người dùng thấy "không có gì".
- Dữ liệu cây hệ thống (832 thiết bị) đã được fetch đầy đủ theo trang (T30).

## Mục tiêu
1. Đảm bảo MindMap luôn hiển thị trung tâm khi mở.
2. Tự động mở rộng các cấp độ cần thiết (Phân loại, Nhóm hệ thống) để người dùng thấy cấu trúc ngay lập tức.
3. Fix lỗi CSS hoặc layout nếu tab "Sơ đồ" bị ẩn hoặc không phản hồi.

## Các bước thực hiện

### 1. Kiểm tra và sửa lỗi hiển thị MindMap
- Kiểm tra lại logic `fitView` trong `CayMindMap.tsx`. Đảm bảo nó được gọi sau khi nodes đã được render.
- Thêm một nút "Căn giữa sơ đồ" (Recenter) thủ công để người dùng tự cứu nếu sơ đồ bị trôi.
- Đảm bảo `ReactFlow` chiếm toàn bộ diện tích `PageBody`.

### 2. Cải thiện trải nghiệm ban đầu
- Mở sẵn các nhánh đến cấp **Nhóm hệ thống (nh)**. Cấp **Hệ thống (ht)** và **Tài sản (tb)** sẽ được thu gọn để tránh quá tải thị giác khi có hàng nghìn nút.
- Tối ưu hóa hiệu năng render MindMap khi có số lượng lớn nodes (sử dụng `useMemo` và `useCallback` chặt chẽ hơn).

### 3. Đồng bộ trạng thái giữa Cây và MindMap
- Sử dụng `expandedNodes` từ `CayContext` để cả View Cây và MindMap dùng chung trạng thái đóng/mở nếu có thể, hoặc ít nhất là khởi tạo MindMap từ trạng thái hiện tại của Cây.

## Chi tiết kỹ thuật
- **File ảnh hưởng**: 
    - `src/components/mirats/he-thong-cay/CayMindMap.tsx`
    - `src/routes/_app.he-thong.cay.tsx`
- **Thư viện**: `@xyflow/react`.
- **Logic expansion**: 
    ```typescript
    const initialExpanded = new Set(["root", ...allPls, ...allNhs]);
    ```

## Kiểm tra (Verification Plan)
- Mở preview, vào `/he-thong/cay`, chọn tab "Sơ đồ".
- Xác nhận thấy nút "Root" (VATM) ở giữa và các nhánh Phân loại (Không lưu, Thông tin, ...) tỏa ra.
- Click "Expand" trên một Hệ thống để xem danh sách tài sản.
- Kiểm tra tính năng kéo thả và zoom.
