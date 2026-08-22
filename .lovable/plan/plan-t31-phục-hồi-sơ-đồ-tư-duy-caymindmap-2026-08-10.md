# Plan - T31: Phục hồi sơ đồ tư duy (CayMindMap)

Phôi phục đầy đủ tính năng của sơ đồ tư duy cho trang Cây hệ thống, bao gồm khả năng thu phóng, các nút điều khiển, khung phân tầng và tính năng kéo thả đổi cha.

## Các bước thực hiện

### Bước 1: Khôi phục khả năng thu phóng (minZoom/maxZoom)

- Chỉnh sửa `src/components/mirats/he-thong-cay/CayMindMap.tsx`.
- Thêm `minZoom={0.05}` và `maxZoom={1.5}` vào component `ReactFlow`. Giá trị 0.05 là quan trọng để nhìn được toàn cảnh sơ đồ rộng.

### Bước 2: Chuẩn hoá Controls và MiniMap

- Cập nhật `<Controls />` thành `<Controls showInteractive={false} />` để tránh nút khoá tương tác gây nhầm lẫn.
- Cập nhật `<MiniMap />` thành `<MiniMap pannable zoomable className="!hidden sm:!block" />` để hỗ trợ điều hướng nhanh và ẩn trên mobile.

### Bước 3: Khôi phục Khung phân tầng (LayerNode)

- Định nghĩa lại component `LayerNode` để hiển thị nhãn các tầng (Phân loại, Lĩnh vực, Nhóm...).
- Cập nhật `nodeTypes` để bao gồm cả `mind` và `layer`, loại bỏ `as any`.
- Trong logic tạo nodes (`useMemo`), thêm mã để sinh ra các `layerNodes` dựa trên mảng `layerLabels` và tọa độ cột `COL` đã tính toán.

### Bước 4: Khôi phục tính năng Kéo thả đổi cha

- Thêm `getIntersectingNodes` vào hook `useReactFlow`.
- Bổ sung các prop `onMoveGroup` và `onMoveDevice` cho component `CayMindMap`.
- Triển khai các hàm helper:
  - `collectDescendants`: để kéo cả nhánh khi di chuyển node cha.
  - `systemsOfLv` / `systemsOfNh`: để thu thập ID hệ thống khi di chuyển cả cụm.
- Cấu hình các sự kiện `onNodeDragStart`, `onNodeDrag`, và `onNodeDragStop` trên `ReactFlow` để xử lý logic va chạm và gọi các hàm callback di chuyển (`onMoveSystem`, `onMoveGroup`, `onMoveDevice`).
- Cập nhật file `src/routes/_app.he-thong.cay.tsx` để truyền các handler tương ứng (tạm thời có thể dùng `toast` hoặc logic cơ bản nếu các dialog xác nhận chưa được khôi phục hoàn toàn ở phía route).

## Kiểm tra và Hoàn thiện

- Chạy `npx tsc --noEmit` để đảm bảo không có lỗi kiểu dữ liệu (đặc biệt là sau khi gỡ `as any`).
- Chạy `npm run test` để kiểm tra các regression.
- Kiểm tra thực tế trên trình duyệt:
  - Sơ đồ phải hiển thị toàn cảnh khi `fitView`.
  - Thao tác kéo thả phải kích hoạt đúng logic di chuyển.
  - Khung tầng phải hiển thị đúng vị trí phía trên các cột.
