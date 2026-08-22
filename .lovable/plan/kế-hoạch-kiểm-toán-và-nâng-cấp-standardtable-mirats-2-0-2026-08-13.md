# Kế hoạch Kiểm toán và Nâng cấp StandardTable — MIRATS 2.0

## Bối cảnh

Thành phần `StandardTable` là "trái tim" hiển thị dữ liệu của MIRATS 2.0, phục vụ từ danh mục đơn giản đến quản lý 1100+ thành phần hệ thống. Sau các đợt refactor trước đó làm mất tính năng, kế hoạch này tập trung vào việc **bảo tồn và củng cố** trước khi mở rộng.

## 1. Kiểm toán API hiện tại (StandardTable.tsx)

### API Hợp đồng (StandardTableProps)

| Prop          | Kiểu          | Mặc định    | Ý nghĩa                         | Rủi ro khi đổi                  |
| :------------ | :------------ | :---------- | :------------------------------ | :------------------------------ |
| `rows`        | `T[]`         | `[]`        | Dữ liệu đầu vào                 | Cao (ảnh hưởng ảo hóa)          |
| `columns`     | `StdColumn[]` | `[]`        | Định nghĩa cột                  | Rất cao (mapping dữ liệu)       |
| `tableKey`    | `string`      | `"default"` | Định danh lưu preference        | Mất cấu hình người dùng         |
| `selectable`  | `boolean`     | `undefined` | Bật checkbox chọn dòng          | Ảnh hưởng `bulkActions`         |
| `bulkActions` | `fn`          | `undefined` | Render toolbar khi có dòng chọn | Logic thao tác hàng loạt        |
| `editMode`    | `boolean`     | `undefined` | Chế độ chỉnh sửa nhanh          | Trạng thái nút thao tác         |
| `virtualizer` | (Internal)    | `36px`      | Ảo hóa hàng                     | Layout bị vỡ nếu row height đổi |

### Cấu trúc Cột (StdColumn)

- `key`, `label`, `value`, `cell`: Cốt lõi hiển thị.
- `filter`: `"text"` (search) hoặc `"cat"` (dropdown filter).
- `hideBelow`: Responsive hiding (md, lg, hoặc số px).
- `defaultHidden`: Ẩn mặc định nhưng cho phép người dùng bật lại.

## 2. Cơ chế Lưu trữ (use-column-prefs.ts)

- **Đồng bộ 2 tầng:** LocalStorage (tức thời) + Supabase `bang_cot_tuy_chinh` (vĩnh viễn theo user_id).
- **Tính năng:** Ghi nhớ thứ tự (`order`), trạng thái ẩn (`hidden`), độ rộng (`widths`), và `activePreset`.
- **Ràng buộc:** Cột `actions` luôn được ghim ở cuối cùng (reconcileOrder).

## 3. Bản đồ sử dụng (Call Sites)

Hiện có **76 file** liên quan đến StandardTable, tiêu biểu:

- **ThanhPhanTable.tsx:** Phức tạp nhất, dùng `clientPagination`, `bulkActions`, `presets`.
- **CatalogTable.tsx:** Dùng cho mọi danh mục `dm_*`, dùng `toolbarRight` để xuất CSV.
- **AuditLogViewer.tsx:** Bảng log dữ liệu lớn, ưu tiên tốc độ render.
- **SparePartsTable.tsx:** Quản lý linh kiện, nhiều cột thông số kỹ thuật.

## 4. Kiểm toán Bảng thô (<table>)

Khoảng **19 file** dùng bảng thô, cần phân loại:

- **Nên chuyển sang StandardTable:** `AssetRegistryBook`, `SparePartsTable` (nếu chưa chuyển), `AuditLog`.
- **Giữ nguyên (Bảng trình bày/Ma trận):** `AllInOneChecklist`, `Topology`, `FieldPreview` (do layout đặc thù, không cần filter/sort).

## 5. Danh sách tính năng "Bất khả xâm phạm"

1. **Ảo hóa (Virtualization):** Phải chịu tải được 2000+ dòng không lag.
2. **User Preferences:** Đổi máy/trình duyệt không mất cột đã sắp xếp.
3. **Filter & Search:** Phải hỗ trợ tiếng Việt có dấu/không dấu (normalize).
4. **Responsive:** Tự ẩn cột trên Mobile theo `hideBelow`.
5. **Bulk Actions:** Logic chọn tất cả / chọn theo trang.

## 6. Kế hoạch hành động

### Giai đoạn 1: Bảo vệ (Bổ sung Test)

- Thêm test case cho `useColumnPrefs` (giả lập lưu/ghi Supabase).
- Thêm test case cho `StandardTable` với `selectable=true` và click chọn dòng.
- Test responsive: Giả lập chiều rộng container để kiểm tra `hideBelow`.

### Giai đoạn 2: Nâng cấp (Cộng thêm)

- Thêm prop `onColumnsChange` (nếu cần sync ra ngoài).
- Tối ưu `ResizeObserver` để tránh re-render thừa.
- Chuẩn hóa CSS cho `editMode` (border/background khi hover vào ô có thể sửa).

### Giai đoạn 3: Porting

- Chuyển các bảng thô phù hợp sang `StandardTable` theo từng file riêng biệt.

## Chỉ số nghiệm thu

- `npx tsc --noEmit` thành công.
- Không làm thay đổi layout của 29 call site hiện tại.
- Tốc độ cuộn trên `ThanhPhanTable` (1100 dòng) giữ vững 60fps.
- User Preferences không bị reset sau khi update code.
