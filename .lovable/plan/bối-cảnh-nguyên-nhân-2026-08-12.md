---
name: Phục hồi Hiển thị Sơ đồ tư duy (MindMap)
description: Khắc phục lỗi MindMap không hiển thị do dữ liệu rỗng và xung đột route, đồng thời đồng bộ hóa trạng thái mở rộng giữa các tab.
type: feature
---

## Bối cảnh & Nguyên nhân

Hiện tại Sơ đồ tư duy (MindMap) không hiển thị do 3 nguyên nhân chính:

1. **Dữ liệu trống:** `viewTree` trong `CayContext` không được cập nhật từ kết quả tính toán của `_app.he-thong.cay.tsx`.
2. **Xung đột Route:** Trình duyệt đang ở `/so-do/...` (Trình vẽ thủ công) thay vì `/he-thong/cay?view=mindmap`.
3. **Lỗi gieo trạng thái:** `initialSeedRef` trong `CayContext` ngăn cản việc tự động mở rộng các nhánh khi dữ liệu tải xong nếu tab MindMap chưa được chọn.

## Giải pháp phục hồi

### 1. Đồng bộ dữ liệu Cây (`CayContext`)

- Cập nhật `viewTree` trong `_app.he-thong.cay.tsx` ngay khi tính toán xong để toàn bộ ứng dụng (bao gồm MindMap) nhận được dữ liệu.
- Đảm bảo `CayMindMap` sử dụng dữ liệu từ `viewTree` của Context thay vì props truyền xuống trực tiếp (hoặc đồng bộ cả hai).

### 2. Sửa lỗi gieo trạng thái mở rộng

- Cho phép `CayContext` gieo lại trạng thái `expandedNodes` khi `viewTree` thay đổi từ rỗng sang có dữ liệu, thay vì chỉ chạy một lần duy nhất.
- Đảm bảo các node gốc (`root`, `root-stopped`, `pl:*`) luôn được mở rộng mặc định.

### 3. Khắc phục lỗi hiển thị 0px / NaN

- Áp dụng `flex-1` và `h-full` thực sự cho container của ReactFlow trong `CayMindMap.tsx`.
- Thêm guard `Number.isFinite` cho tọa độ các node lớp (`layerNodes`) để tránh làm hỏng viewport.

### 4. Đồng bộ hóa Navigation

- Khi người dùng chọn tab "Sơ đồ", cập nhật URL search param `?view=mindmap` và ngược lại.
- Điều hướng đúng về `/he-thong/cay` nếu đang ở sai route.

## Danh sách file sửa đổi

- `src/routes/_app.he-thong.cay.tsx`: Đồng bộ `viewTree` vào Context.
- `src/components/mirats/he-thong-cay/CayContext.tsx`: Cải thiện logic gieo trạng thái mở rộng.
- `src/components/mirats/he-thong-cay/CayMindMap.tsx`: Sửa layout và guard tọa độ.

## Kế hoạch kiểm tra

1. Truy cập `/he-thong/cay`, chọn tab "Sơ đồ" -> Phải thấy node gốc.
2. Tìm kiếm một thiết bị -> MindMap phải tự động mở nhánh và zoom tới thiết bị đó.
3. Reload trang -> Phải giữ nguyên tab "Sơ đồ" và dữ liệu.
