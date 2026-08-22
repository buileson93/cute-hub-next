# Plan: Nối lại ghi nhớ cột vào StandardTable (T6b)

Khôi phục tính năng ghi nhớ thứ tự và ẩn/hiện cột cho `StandardTable.tsx` bằng cách tích hợp `useColumnPrefs.ts`. Đây là một thay đổi quan trọng ảnh hưởng đến ~33 màn hình.

## 1. Mục tiêu

- Kích hoạt lại `useColumnPrefs` trong `StandardTable`.
- Đảm bảo logic lọc cột 3 tầng:
  - **Tầng 1 (User Preferences):** Ẩn ở mọi nơi (UI & Export).
  - **Tầng 2 (Responsive - hideBelow):** Chỉ ẩn trên UI, vẫn xuất hiện trong Export.
  - **Tầng 3 (Hardcoded hidden):** Ẩn ở mọi nơi.
- Duy trì thứ tự cột do người dùng sắp xếp.
- Đảm bảo tính tương thích ngược với các màn hình hiện tại.

## 2. Các bước thực hiện

### Bước 1: Tích hợp `useColumnPrefs` vào `StandardTable.tsx`

- Import `useColumnPrefs` từ `@/lib/mirats/use-column-prefs`.
- Gọi `useColumnPrefs(tableKey, allKeys, defaultHidden)` bên trong component.
- Tính toán `allKeys` từ `columns`.
- Tính toán `defaultHidden` từ các cột có `defaultHidden: true`.

### Bước 2: Cập nhật logic `shownCols` và `exportCols`

- **Thứ tự:** Sử dụng `order` từ `useColumnPrefs` để sắp xếp lại danh sách cột gốc.
- **shownCols (Hiển thị UI):**
  - Lọc bỏ cột bị ẩn bởi User (Tầng 1).
  - Lọc bỏ cột có `hidden: true` (Tầng 3).
  - Lọc bỏ cột theo breakpoint `hideBelow` và `vw` (Tầng 2).
- **exportCols (Xuất file):**
  - Lọc bỏ cột bị ẩn bởi User (Tầng 1).
  - Lọc bỏ cột có `hidden: true` (Tầng 3).
  - **KHÔNG** lọc theo `hideBelow` (Bỏ qua Tầng 2).

### Bước 3: Viết bài kiểm thử tự động (Automated Test)

- Tạo file `src/__tests__/standard-table-columns.test.ts`.
- Mock `useColumnPrefs` và `window.innerWidth`.
- Test các kịch bản:
  1. Người dùng ẩn cột -> Biến mất cả UI và Export.
  2. Cột có `hideBelow` trên màn hình nhỏ -> Biến mất UI, vẫn có trong Export.
  3. Không có `tableKey` -> Hoạt động bình thường (không crash).
  4. Thứ tự cột thay đổi -> UI hiển thị đúng thứ tự mới.

## 3. Phạm vi sửa đổi (Tối đa 3 file)

1. `src/components/mirats/StandardTable.tsx` (Logic chính).
2. `src/lib/mirats/use-column-prefs.ts` (Nếu cần điều chỉnh chữ ký).
3. `src/__tests__/standard-table-columns.test.ts` (File test mới).

## 4. Kiểm tra & Xác nhận

- [ ] Chạy `npm test` để xác nhận logic 3 tầng.
- [ ] Chạy `npx tsc --noEmit` để kiểm tra kiểu dữ liệu.
- [ ] Kiểm tra thực tế trên trình duyệt: Ẩn cột, F5, và kiểm tra Export.

Tôi sẽ bắt đầu triển khai ngay khi bạn đồng ý kế hoạch này.
