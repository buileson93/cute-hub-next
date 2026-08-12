# Kế hoạch Phục hồi Tính năng Chi tiết Tài sản (Device Detail Parity)

Bản refactor mới đã tách giao diện thành các Tab chuyên biệt nhưng đang thiếu các logic nghiệp vụ quan trọng từ bản "chaytot", đặc biệt là chế độ chỉnh sửa (Edit Mode) và các tương tác ghi dữ liệu an toàn.

## 1. Bản đồ Tính năng & Tab (Parity Map)

| Tính năng cũ | Tab mới (MIRATS 2.0) | Component/Logic đích |
|:---|:---|:---|
| Thông tin tài sản & Sửa trường | **TabTổngQuan** | `InfoRow` + `inline-edit` |
| Dòng thời gian (Timeline) | **TabVậnHành** | `Timeline` component |
| Sổ lý lịch (Lý lịch trích ngang) | **TabTổngQuan** | `LyLichThietBiPanel` |
| Linh kiện / Khe gắn | **TabCấuHình** | `KheLinhKienPanel` |
| Đo đạc / Telemetry | **TabCấuHình** | `TelemetryPanel` |
| Vòng đời & Lifecycle actions | **TabNângCao** | `LifecyclePanel` |
| Kiểm định / Hiệu chuẩn (KĐ/HC) | **TabHồSơPhápLý** | `ChungChiPanel` |
| Giấy phép khai thác | **TabHồSơPhápLý** | `sysGpSo` logic |
| Bảo trì / Sự cố / Hỏng hóc | **TabVậnHành** | `EventRow` & Tab con tương ứng |
| Bàn giao / Cấp phát / Thu hồi | **TabVậnHành** / **TabCấuHình** | `AllocationPanel` |
| Phần mềm / Bản quyền | **TabCấuHình** | `ThietBiBanQuyen` |
| Tệp đính kèm | **TabHồSơPhápLý** | `ThietBiTepDinhKem` |
| Nhật ký thay đổi (Audit) | **TabNângCao** | `ChangeLogPanel` |

## 2. Kiến trúc Cổng ghi & Permission

Phục hồi route cha `src/routes/_app.thiet-bi.$maThietBi.tsx` để quản lý trạng thái tập trung:
- `canManage`: Kiểm tra quyền `admin` hoặc `phong_kt` (dùng `useCan`).
- `editMode`: State quản lý việc bật/tắt nút "Bật chỉnh sửa".
- `canEdit`: `canManage && editMode`.

**Quy trình ghi (Unified Edit Pipeline):**
1. User tương tác với `EditableField` (hoặc `inline-edit`).
2. `useCellEditor` bắt intent chỉnh sửa.
3. Dispatch tới `saveEntityFieldSecurely` (đã có trong `src/lib/mirats/ui/save-entity-securely.ts`).
4. Nếu là Admin: Update trực tiếp vào DB (`thiet_bi`).
5. Nếu là KTV/User: Tạo `change_request` để phê duyệt.

## 3. Kế hoạch triển khai (Commit-based)

### Bước 1: Phục hồi Route Cha & Edit Mode Invariant
- Cập nhật `src/routes/_app.thiet-bi.$maThietBi.tsx` để thêm Toolbar có Switch "Chỉnh sửa".
- Truyền `canEdit`, `editMode` xuống `DetailTabs` và các Sub-tabs qua props/context.
- **Invariant:** Nếu `!editMode`, mọi input phải ở trạng thái `read-only` hoặc không render icon Pencil.

### Bước 2: Porting Tab Tổng Quan (Commit 1)
- Tích hợp `inline-edit` vào các `InfoRow`.
- Phục hồi logic hiển thị ảnh Model và liên kết danh mục.

### Bước 3: Porting Tab Vận Hành & Lifecycle (Commit 2)
- Hoàn thiện `Timeline` và `EventRow`.
- Tích hợp `LifecyclePanel` vào Tab Nâng Cao.

### Bước 4: Porting Cấu Hình & Pháp Lý (Commit 3)
- Đấu nối `KheLinhKienPanel` (Linh kiện) và `ThietBiBanQuyen` (Phần mềm).
- Hoàn thiện `ChungChiPanel` (KĐ/HC) và `ThietBiTepDinhKem`.

### Bước 5: Verify & Audit (Commit 4)
- Kiểm tra lại các trường hợp `readonly` khi không có quyền.
- Test luồng `change_request` cho user thường.
- Đảm bảo `invalidateQueries` đúng để cập nhật UI sau khi save.

## 4. Kế hoạch Testing

- **Read-only:** Mở thiết bị với tài khoản `user`, nút "Chỉnh sửa" không hiển thị hoặc bị disable.
- **Direct Save:** Dùng `admin`, sửa tên thiết bị -> F5 -> Tên mới vẫn tồn tại.
- **Audit Log:** Sau khi sửa, kiểm tra Tab Nâng Cao > Nhật ký thay đổi có dòng log mới.
- **Responsive:** Kiểm tra giao diện trên Mobile (Tab list phải scroll được hoặc wrap).

Tôi đã sẵn sàng thực hiện kế hoạch này.
