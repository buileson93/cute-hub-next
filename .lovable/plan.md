# Plan - Phục hồi hệ thống MindMap và Cây phân cấp (Fix Invalid Hook Call)

Phân tích nguyên nhân: Lỗi "Invalid Hook Call" thường xảy ra khi các hook của `@xyflow/react` (như `useReactFlow`, `useNodesState`, v.v.) được sử dụng bên ngoài `ReactFlowProvider`. Ngoài ra, việc gọi hook trong các hàm helper `buildTree` hoặc logic điều kiện cũng có thể gây ra vấn đề này.

## User Review Required

> [!IMPORTANT]
> Cần xác nhận xem lỗi này xảy ra ngay khi tải trang hay khi thực hiện tìm kiếm/thao tác cụ thể. Tôi sẽ tập trung vào việc đảm bảo Context Provider được bọc đúng cách và loại bỏ các logic hook không an toàn.

## Proposed Changes

### 1. Phục hồi cấu trúc Provider trong `src/routes/_app.he-thong.cay.tsx`
- Đảm bảo `ReactFlowProvider` bao bọc toàn bộ thành phần trang có sử dụng hook của React Flow.
- Kiểm tra lại logic `HeThongCayPageWrapper` để chắc chắn không có sự rò rỉ hook ra ngoài scope cho phép.

### 2. Sửa lỗi Hook trong các thành phần MindMap
- Di chuyển các hook `useReactFlow`, `useNodesState` vào đúng vị trí bên trong các thành phần được Provider bảo vệ.
- Kiểm tra file `src/components/mirats/he-thong-cay/CayMindMap.tsx` để xử lý các logic focus/zoom có thể đang vi phạm quy tắc Hook.

### 3. Tối ưu hóa logic `useMemo` và `useEffect`
- Sửa lỗi trong `src/components/mirats/he-thong-cay/CayContext.tsx` liên quan đến việc cập nhật state `expandedNodes` để tránh trigger re-render vô hạn.
- Đảm bảo `buildTree` là một hàm thuần (pure function) và không chứa bất kỳ hook ẩn nào.

### 4. Đồng bộ hóa tìm kiếm (Unified Search)
- Đảm bảo kết quả từ `NodeSearch` kích hoạt đúng các action mở rộng cây (expand) và focus vào sơ đồ mà không gây lỗi runtime.

## Technical Details

- **React Flow Scope**: Hook `useReactFlow()` chỉ hoạt động khi component nằm dưới `<ReactFlowProvider>`. Hiện tại code đã có bọc nhưng có thể một số logic con đang được gọi ở level quá cao.
- **Hook Rules**: Rà soát việc gọi hook trong `buildTree` hoặc các utils. Link `react.dev/link/invalid-hook-call` chỉ ra việc gọi hook có điều kiện hoặc trong hàm thường.
- **State Sync**: Logic `useEffect` đồng bộ URL `view` param trong `cay.tsx` cần được debounce hoặc kiểm tra `prevValue` chặt chẽ hơn.

## Phân công công việc (Sub-tasks)
1. **Kiểm tra Provider**: Audit `HeThongCayPageWrapper`.
2. **Fix MindMap Hooks**: Kiểm rà `useNodesState` và `useReactFlow` trong `CayMindMap.tsx`.
3. **Fix Context**: Kiểm tra logic `seededTreeRef` trong `CayProvider`.
4. **Validation**: Chạy Playwright test để xác nhận trang `/he-thong/cay` tải thành công.
