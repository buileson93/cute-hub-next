# Kế hoạch Xây dựng Hệ thống Icon Ngữ nghĩa và Chuẩn hoá Trạng thái

Dự án hiện có sự thiếu nhất quán trong việc sử dụng icon (hơn 277 file import trực tiếp) và các trạng thái nghiệp vụ (dùng ký tự Unicode thay vì icon chuẩn). Kế hoạch này thiết lập một tầng icon ngữ nghĩa (Semantic Icons) giúp quản lý tập trung và đảm bảo tính nhất quán visual.

## A. Bảng đăng ký Icon Ngữ nghĩa (Draft)

| Nhóm           | Ý nghĩa       | Icon Lucide      | Kích thước | Ghi chú                             |
| :------------- | :------------ | :--------------- | :--------- | :---------------------------------- |
| **Hành động**  | Xem chi tiết  | `Eye`            | SMALL      | Thay cho `FileText`, `ExternalLink` |
|                | Chỉnh sửa     | `Pencil`         | SMALL      | Nhất quán thay cho `Edit`           |
|                | Xoá           | `Trash2`         | SMALL      | Kèm màu destructive                 |
|                | Lịch sử       | `History`        | SMALL      | Nhất quán thay cho `Clock`          |
|                | Đính kèm      | `Paperclip`      | SMALL      |                                     |
|                | Nhân bản      | `Copy`           | SMALL      |                                     |
| **Bảng**       | Sắp xếp tăng  | `ArrowUp`        | TINY       |                                     |
|                | Sắp xếp giảm  | `ArrowDown`      | TINY       |                                     |
|                | Chưa sắp xếp  | `ChevronsUpDown` | TINY       |                                     |
|                | Lọc dữ liệu   | `Filter`         | SMALL      |                                     |
|                | Đang có lọc   | `FilterX`        | SMALL      | Hiện nút xoá lọc                    |
|                | Cài đặt cột   | `Settings2`      | SMALL      | Thay cho `SlidersHorizontal`        |
| **Trạng thái** | Thành công    | `CheckCircle2`   | SMALL      | Màu xanh lá                         |
|                | Cảnh báo      | `AlertTriangle`  | SMALL      | Màu vàng                            |
|                | Nguy hiểm/Lỗi | `XCircle`        | SMALL      | Màu đỏ                              |
|                | Thông tin     | `Info`           | SMALL      | Màu xanh dương                      |
| **Thực thể**   | Thiết bị      | `HardDrive`      | SMALL      |                                     |
|                | Hệ thống      | `Network`        | SMALL      |                                     |
|                | Nhân viên     | `User`           | SMALL      |                                     |

## B. Giải quyết mâu thuẫn (Conflict Resolution)

| Nhóm mâu thuẫn      | Giải pháp                                        | Lý do                                                |
| :------------------ | :----------------------------------------------- | :--------------------------------------------------- |
| **Cảnh báo**        | Dùng `AlertTriangle` (71 lần)                    | Phổ biến nhất và đúng ngữ nghĩa cảnh báo.            |
| **Hoàn tất**        | Dùng `CheckCircle2` (42 lần)                     | Rõ ràng hơn `Check` đơn thuần trong trạng thái.      |
| **Tải lại/Đặt lại** | `RefreshCw` cho Tải lại, `RotateCcw` cho Đặt lại | Phân biệt rõ hành động Fetch dữ liệu vs Reset State. |
| **Điều hướng**      | Dùng `ArrowLeft`                                 | Thống nhất hướng mũi tên quay lại.                   |

## C. Thang kích thước Icon (Tied to UI_DENSITY)

Dựa trên `src/lib/mirats/ui/ui-density.ts`:

- **ICON_TINY** (12px/14px): Dùng trong ô dữ liệu bảng, inline text.
- **ICON_SMALL** (14px/16px): Dùng trong Buttons, Menu items, Status badges.
- **ICON_MEDIUM** (18px/20px): Dùng trong Header trang, Toolbars lớn.
- **ICON_LARGE** (24px+): Dùng cho Empty states, trang lỗi.

## D. Đặc tả mở rộng Status Tokens

Bổ sung trường `icon` vào các object trong `status-tokens.ts`:

```typescript
// src/lib/mirats/ui/status-tokens.ts
export const TRANG_THAI_TOKEN = {
  DANG_KHAI_THAC: {
    class: "...",
    dot: "...",
    kyHieu: "●", // Giữ nguyên để không vỡ code cũ
    icon: "CheckCircle2", // Thêm mới: key của icon ngữ nghĩa
    label: "Đang khai thác",
  },
  // ...
};
```

## E. Kế hoạch áp dụng (Implementation Plan)

### Bước 1: Khởi tạo Hạ tầng (1 commit)

- Tạo `src/lib/mirats/ui/icon-registry.ts` định nghĩa ánh xạ.
- Tạo `src/components/mirats/ui/Icon.tsx` - Component bao bọc (wrapper) xử lý size/aria.
- Cập nhật `status-tokens.ts` thêm trường `icon` cho tất cả các token hiện có.

### Bước 2: Nâng cấp Core Components (2 commits)

- **StatusBadge**: Cập nhật để ưu tiên hiển thị `icon` thay vì `kyHieu` (nếu có).
- **StandardTable**: Thay thế các icon Lucide cứng bằng `Icon` component với các key `Table.SortAsc`, `Table.Filter`, v.v.

### Bước 3: Di trú diện rộng (Theo Route Group)

- Nhóm 1: Các trang Dashboard & Tổng quan.
- Nhóm 2: Trang chi tiết Thiết bị (maThietBi).
- Nhóm 3: Các trang Danh mục & Cài đặt.
- Sử dụng `sed` để thay thế hàng loạt các import phổ biến sang `Icon` component.

### Bước 4: Kiểm soát Vi phạm

- Thêm quy tắc vào quy trình code review: Cấm import trực tiếp từ `lucide-react` trừ trường hợp icon cực kỳ đặc thù không nằm trong registry.

## F. Danh sách kiểm tra Trợ năng (Accessibility Checklist)

- [ ] Tất cả các nút chỉ có icon (IconButton) phải có `aria-label` tiếng Việt.
- [ ] Icon trang trí (cạnh text) phải có `aria-hidden="true"`.
- [ ] Trạng thái màu sắc (Badges) luôn đi kèm text hoặc tooltip (không chỉ dùng màu/icon đơn thuần).
- [ ] Đảm bảo độ tương phản màu icon (đặc biệt trong Dark Mode).

## Kỹ thuật

- Sử dụng `React.lazy` hoặc import động nếu registry quá lớn để tối ưu bundle (tùy chọn).
- `Icon` component sẽ nhận prop `name` là key từ registry.
