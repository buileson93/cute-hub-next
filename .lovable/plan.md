# Kế hoạch Chuẩn hóa Kiểu Ô và Tinh gọn Bảng (StandardTable)

## Bối cảnh
Hệ thống hiện có 551 cột trải dài trên nhiều bảng, nhưng độ phủ của các tính năng nâng cao (filter, hideBelow, lineClamp) còn thấp. Nhiều ô vẫn đang hiển thị dạng text thô thay vì sử dụng 13 component trình bày đã có sẵn.

## Mục tiêu
1.  **Định nghĩa Tập kiểu ô (Cell Types):** Phân loại toàn bộ cột vào các kiểu chuẩn để tự động hóa định dạng và component.
2.  **Tinh gọn các bảng lớn:** Gộp các cụm cột liên quan, ẩn mặc định các cột phụ để tăng mật độ thông tin mà không mất dữ liệu.
3.  **Chuẩn hóa Trình bày:** Sử dụng nhất quán các component `StatusBadge`, `CodeBadge`, `UserAvatar`, v.v.
4.  **Bảo toàn Tính năng:** Giữ nguyên khả năng lọc, sắp xếp và đảm bảo tệp xuất CSV đầy đủ 100% cột nguyên thủy.

## A. Bảng Tập Kiểu Ô (Standard Cell Types)

| Tên kiểu | Căn lề | Component | Tooltip | Lọc | Sắp xếp |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | Trái | `CodeBadge` | Có (Full ID) | Text | Text |
| `status` | Trái | `StatusBadge` | Không | Cat | Text |
| `taxonomy` | Trái | `MauChip` | Không | Cat | Text |
| `user` | Trái | `UserAvatar` | Tên đầy đủ | Cat | Text |
| `number` | Phải | Tabular nums | Không | Text | Numeric |
| `currency` | Phải | `fmtVND` | Không | Text | Numeric |
| `percent` | Trái | `Progress` + % | Không | Text | Numeric |
| `date` | Trái | `fmtDate` | Khoảng cách | Text | Date |
| `expiring` | Trái | `ExpiringBadge` | Ngày cụ thể | Text | Numeric |
| `boolean` | Giữa | `Icon` (Check/X) | Label | Cat | Boolean |
| `path` | Trái | Cấp cuối | Full path | Text | Text |
| `longtext` | Trái | `lineClamp: 1` | Full text | Text | Text |
| `actions` | Phải | `Icon` group | Tooltip | Không | Không |

## B. Phương án Tinh gọn Bảng 26 cột (Danh mục Thiết bị)

**Số cột: 26 → 14 (Hiển thị mặc định)**

1.  **Gộp Cụm Mã (Identities):** Số serial + Mã Bravo + P/N → Cột "Định danh".
    *   *Hiển thị:* Mã Bravo (chính), SN & P/N (dòng 2 nhỏ hoặc tooltip).
    *   *Mở rộng:* Xem đủ 3 mã ở Row Expansion.
2.  **Gộp Cụm Không gian (Space):** Hệ thống + Đơn vị + Vị trí → Cột "Vị trí lắp đặt".
    *   *Hiển thị:* Cấp cuối (Vị trí), Đơn vị & Hệ thống (tooltip/breadcrumb).
3.  **Gộp Cụm Phân loại (Taxonomy):** Chủng loại + Phân loại + Nhóm hệ thống → Cột "Phân loại".
    *   *Hiển thị:* Chủng loại (MauChip), các phần còn lại ở Row Expansion.
4.  **Ẩn mặc định (Default Hidden):**
    *   Năm sản xuất, Năm khai thác, Tuổi thọ (Đẩy vào Row Expansion).
    *   Ghi chú (lineClamp 1, ẩn mặc định nếu trống).
    *   Nhà cung cấp (Đẩy vào Row Expansion).

## C. Đặc tả Thay đổi Kỹ thuật

### 1. Cập nhật `ColumnDef<T>` (src/components/mirats/StandardTable.tsx)
```typescript
export interface ColumnDef<T> {
  // ... giữ nguyên ...
  type?: "id" | "status" | "taxonomy" | "user" | "number" | "currency" | "percent" | "date" | "expiring" | "boolean" | "path" | "longtext" | "actions";
}
```

### 2. Logic Xử lý Ô (Cell Renderer)
Trong `StandardTable`, bổ sung helper `renderAutoCell` để tự động chọn component dựa trên `type` nếu `render/cell` không được định nghĩa.

### 3. Đảm bảo Tương thích CSV
`src/lib/mirats/ui/table-export.ts` sẽ được cập nhật để:
*   Luôn lấy dữ liệu từ `exportCols` (gồm cả cột ẩn mặc định).
*   Sử dụng `value(row)` nguyên bản để xuất thay vì HTML từ `render`.

## D. Kế hoạch Triển khai (Commit-by-Table)

1.  **Commit 1:** Mở rộng `ColumnDef` và cài đặt `renderAutoCell` trong `StandardTable.tsx`.
2.  **Commit 2:** Áp dụng cho bảng 26 cột (`_app.danh-muc.thiet-bi.tsx`). Gộp cụm và thiết lập `type`.
3.  **Commit 3:** Áp dụng cho bảng Tuổi thọ (`_app.tuoi-tho.tsx`). Căn phải số, tiền, thanh tiến độ.
4.  **Commit 4:** Áp dụng cho bảng Bàn giao (`_app.ban-giao.tsx`). Xử lý `longtext` và `user`.
5.  **Commit 5:** Áp dụng cho `CatalogTable.tsx` và 2 bảng còn lại.
6.  **Commit 6:** Kiểm soát `lineClamp` toàn hệ thống và kiểm định CSV.

## E. Danh sách Kiểm chứng (Test Cases)
*   **Search:** Tìm " Bravo123" vẫn ra dòng dù Mã Bravo đã bị gộp vào tooltip/dòng 2.
*   **CSV:** Xuất file bảng 26 cột, kiểm tra đủ 26 cột dữ liệu thô.
*   **Mobile:** Các cụm gộp hiển thị gọn gàng trong Card mode.
*   **Performance:** Kiểm tra lag khi scroll bảng 1000 dòng có nhiều `lineClamp` đo động.
