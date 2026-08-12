# Kế hoạch UI/UX 2.0 - Giai đoạn 9 & 10: Refactor Hệ thống & Cây hệ thống

## Mục tiêu
1. Giải quyết lỗi build `TS2554` trong `mutations.ts` liên quan đến `createServerFn`.
2. Hoàn thiện việc tách nhỏ file `cay.tsx` (>6000 dòng) thành các component chuyên biệt trong `src/components/mirats/he-thong-cay/`.
3. Di chuyển toàn bộ logic mutation từ `cay.tsx` sang `mutations.ts` sử dụng `createServerFn`.
4. Cập nhật `TreeView.tsx`, `NodeEditorSheet.tsx` và `CayMindMap.tsx` với logic render đầy đủ từ file gốc.

## Các bước thực hiện

### 1. Sửa lỗi build và hoàn thiện Mutation (`mutations.ts`)
- **Vấn đề**: Lỗi `Expected 2-3 arguments, but got 1` khi gọi `.validator()`.
- **Giải pháp**: Sử dụng signature `validator(parser, encoder)` hoặc object `{ parse, serialize }` tùy theo phiên bản TanStack Start thực tế.
- **Nội dung**:
    - Di chuyển các hàm: `renameGroupCode`, `addSystem`, `addDevice`, `deleteNode`, `undoDelete`, `saveCell`, `bulkSaveCell` từ `cay.tsx` sang `mutations.ts`.
    - Chuyển đổi chúng sang `createServerFn` để tận dụng RPC và tối ưu server-side.

### 2. Hoàn thiện TreeView (`TreeView.tsx`)
- Di chuyển logic render đệ quy (Phân loại -> Lĩnh vực -> Nhóm -> Hệ thống -> Tài sản) từ `cay.tsx`.
- Tích hợp logic xử lý sự kiện (Rename, Move, Open Editor, History...) vào các component con.
- Đảm bảo hiệu năng với `useMemo` và tránh re-render không cần thiết.

### 3. Hoàn thiện NodeEditorSheet (`NodeEditorSheet.tsx`)
- Mang toàn bộ form chỉnh sửa chi tiết (bao gồm các trường vật lý theo layer `thiet_bi` / `dm_he_thong`) từ file gốc.
- Tích hợp logic `onSave` gọi đến `saveNode` mutation mới.

### 4. Hoàn thiện CayMindMap (`CayMindMap.tsx`)
- Di chuyển logic tính toán layout đệ quy và bố trí node của `@xyflow/react` từ `cay.tsx`.
- Khôi phục tính năng Toolbar (Incident, Maint, History) trên từng node Mindmap.

### 5. Refactor Route chính (`_app.he-thong.cay.tsx`)
- Sử dụng `CayProvider` để bao bọc toàn bộ trang.
- Thay thế ~5000 dòng code UI bằng các component đã tách.
- Giữ lại logic data fetching (`useDbTaxonomy`, `useAllViTriChucNang`) và đồng bộ hóa state qua context.

### 6. Kiểm tra và Verify
- Chạy build để xác nhận không còn lỗi TS.
- Smoke test các tính năng:
    - Tìm kiếm node.
    - Chỉnh sửa tên (inline & sheet).
    - Di chuyển hệ thống/tài sản.
    - Chuyển đổi giữa 3 chế độ xem (Tree, Table, Mindmap).

## Cửa kiểm soát an toàn
- Đảm bảo logic `renameEntity` và `supabase.upsert` không làm mất dữ liệu.
- Kiểm tra tính nhất quán của `db_taxonomy` sau khi thực hiện các thao tác di chuyển.
