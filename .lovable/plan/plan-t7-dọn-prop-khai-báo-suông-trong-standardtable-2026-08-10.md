# Plan: T7 — Dọn prop khai báo suông trong StandardTable

Rà soát và xử lý các prop trong `StandardTableProps` nhưng không được sử dụng trong mã nguồn của `StandardTable`.

## 1. Mục tiêu
- Loại bỏ các prop "chết" (không ai truyền, không ai dùng).
- Khôi phục tính năng cho các prop "treo" (có người truyền nhưng component không nhận).
- Đảm bảo tính nhất quán và sạch sẽ cho `StandardTable`.

## 2. Kết quả rà soát (Grep)

| Prop | Số chỗ truyền | Tình trạng | Xử lý |
| :--- | :--- | :--- | :--- |
| `presets` | 2 | Treo | Nối vào component |
| `activePreset` | 1 | Treo | Nối vào component |
| `handleSetPreset` | 0 | Chết | Xoá khỏi interface |
| `reset` | 0 | Chết | Xoá khỏi interface |
| `isCustomized` | 0 | Chết | Xoá khỏi interface |
| `hideExport` | 0 | Chết | Xoá khỏi interface |
| `exportName` | 0 | Chết | Xoá khỏi interface |
| `autoFit` | 0 | Chết | Xoá khỏi interface |

## 3. Các bước thực hiện

### Bước 1: Cập nhật `StandardTable.tsx`
- **Interface `StandardTableProps`**: Xoá `handleSetPreset`, `reset`, `isCustomized`, `hideExport`, `exportName`, `autoFit`.
- **Hàm `StandardTable`**: Nhận thêm `presets` và `activePreset` từ destructuring arguments.
- **Logic**: Nối `presets` và `activePreset` vào `useColumnPrefs` để tính năng preset hoạt động.
- **UI (nếu cần)**: Thêm nút chọn preset vào Toolbar nếu có `presets`.

### Bước 2: Kiểm tra
- `npx tsc --noEmit` để đảm bảo không lỗi type ở 33 màn hình.
- `npm test` để đảm bảo logic 3 tầng vẫn chạy tốt.

## 4. Phạm vi sửa đổi
- `src/components/mirats/StandardTable.tsx`
