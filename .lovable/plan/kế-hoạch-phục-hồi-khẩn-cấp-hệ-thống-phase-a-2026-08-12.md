---
name: Emergency MindMap Restoration (Phase A)
description: Khôi phục khẩn cấp giao diện Hệ thống (Tree/Table/MindMap) từ bản "chaytot" để đảm bảo tính năng 100% trước khi tiếp tục refactor.
type: feature
---

# Kế hoạch Phục hồi Khẩn cấp Hệ thống (Phase A)

## 1. Bối cảnh & Mục tiêu
- **Vấn đề:** Bản refactor hiện tại làm mất nhiều behavior quan trọng của MindMap (expand/collapse logic, search/focus, edit mode, realSystems handling).
- **Mục tiêu:** Khôi phục 100% behavior của trang `/he-thong/cay` bằng cách sử dụng lại logic từ bản "chaytot" đã chạy ổn định.

## 2. Chiến lược Giai đoạn A — Phục hồi Nguyên trạng
- **Backup:** Đổi tên file route hiện tại thành `_app.he-thong.cay.refactor-backup.tsx`.
- **Restore:** Đưa mã nguồn từ bản "chaytot" vào `src/routes/_app.he-thong.cay.tsx`.
- **Adaptation:** Chỉ sửa các lỗi import/type do cấu trúc repo mới (ví dụ: `@/integrations/backend/client` thay vì `supabase`).

## 3. Danh sách File & Thay đổi
- **Backup & Restore:**
  - `src/routes/_app.he-thong.cay.tsx`: Khôi phục bản monolithic (~6k dòng).
  - `src/lib/mirats/nav-contract.ts`: Khôi phục menu `/so-do` trỏ về trình vẽ thủ công.
- **Import Mapping:**
  - `supabase` -> `import { supabase } from "@/integrations/backend/client"`
  - `toast` -> `import { toast } from "sonner"` (loại bỏ `useToast` cũ).
  - `useDbTaxonomy`, `useCayRpc`, `useScope`: Giữ nguyên vì các hook này đã tồn tại trong `src/lib/mirats`.
  - `NodeEditorSheet`, `ThanhPhanTable`, `TreeView`: Sử dụng các component hiện có trong `src/components/mirats` hoặc folder `he-thong-cay`.

## 4. Bảng Behavior Parity (Nghiệm thu Giai đoạn A)
| Tính năng | Trạng thái mong đợi |
| :--- | :--- |
| **Tab View** | 3 tab: Danh sách, Bảng, Sơ đồ tư duy |
| **Data Integrity** | Hiển thị đủ PL -> NH -> HT (kể cả HT trống) |
| **Search/Focus** | Mở đúng tổ tiên, zoom tới node, không reset viewport |
| **MindMap UI** | Render logic cũ, không có `NaN` coordinates, `seededRef` hoạt động |
| **Edit Mode** | Nút "Bật chỉnh sửa" áp dụng cho cả 3 view |
| **Unified Write** | Rename PL/NH/HT/TB ghi đúng bảng DB qua `useCellEditor` |
| **Reorganization** | Move/Reorder có dialog xác nhận và RPC thật |
| **Persistance** | F5 giữ nguyên Tab và trạng thái search |

## 5. Giai đoạn B — Tách module cơ học (Hậu Parity)
Sau khi Giai đoạn A được duyệt "Xanh", thực hiện tách module:
1. Tách `buildTree` logic ra `utils.ts`.
2. Tách `MindMap` component nguyên khối ra `CayMindMap.tsx`.
3. Tách `NodeEditor` và `mutations`.
*Lưu ý: Mỗi bước chỉ di chuyển code, không thay đổi thuật toán.*

## 6. Lệnh kiểm tra
- `npx tsc --noEmit`: Kiểm tra lỗi type.
- `npm run build`: Kiểm tra build production trên Edge.
- Kiểm tra thủ công: Đảm bảo `.react-flow__viewport` không bị trắng (NaN).
