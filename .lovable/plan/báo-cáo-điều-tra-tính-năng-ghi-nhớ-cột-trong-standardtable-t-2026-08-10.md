# Báo cáo điều tra: Tính năng ghi nhớ cột trong StandardTable (T6a)

Dựa trên yêu cầu, tôi đã rà soát toàn bộ các file liên quan để làm rõ mâu thuẫn về tính năng ghi nhớ cột. Dưới đây là kết quả chi tiết.

## 1. Cơ chế lưu trữ của `use-column-prefs.ts`

- **Nơi lưu trữ**: File này sử dụng cơ chế lưu kép:
  - **localStorage**: Dùng prefix `mirats:colprefs:v2:` (dòng 28) để nạp nhanh và hỗ trợ offline (dòng 71-89).
  - **Bảng `bang_cot_tuy_chinh`**: Đồng bộ lên database thông qua Supabase RLS (dòng 96-106) khi có `userId`.
- **Chữ ký hàm hiện tại**: `export function useColumnPrefs(tableKey: string, allKeys: string[], defaultHidden: string[] = [])` (dòng 46).
- **Mâu thuẫn**: File này thực sự được đầu tư nâng cấp (từ v1 sang v2, hỗ trợ ghim cột `actions` ở cuối - dòng 33-44) nhưng hiện tại không có component nào trong `src/` thực sự gọi nó.

## 2. Việc sử dụng `tableKey` trong `StandardTable.tsx`

- **Trạng thái**: Mặc dù `tableKey` được khai báo trong interface `StandardTableProps` (dòng 58) và được nhận vào hàm qua destructuring (dòng 91), nó **KHÔNG ĐƯỢC DÙNG** ở bất kỳ đâu trong toàn bộ 280 dòng mã của component này.
- **Hệ quả**: Mọi màn hình truyền `tableKey` vào đều vô tác dụng; thiết lập cột sẽ bị reset mỗi khi tải lại trang.

## 3. Logic lọc cột hiện tại

- **Thứ tự**: Giữ nguyên theo mảng `columns` truyền vào.
- **Tính toán `shownCols` (dòng 105-116)**: Chỉ lọc dựa trên thuộc tính `hidden: boolean` cố định và logic `hideBelow` (đáp ứng responsive theo chiều rộng màn hình `vw`).
- **Tính toán `exportCols` (dòng 120-122)**: Chỉ lọc bỏ những cột có `hidden: true`.

## 4. Cơ chế nhớ cột ở các thành phần khác

- **ThanhPhanTable.tsx**: Không tự nhớ cột. Nó dùng `useUserPref` (dòng 186) để nhớ chế độ hiển thị `viewMode` ("component" | "asset") tại key `thanh-phan:view-mode`. Việc hiển thị bảng vẫn dựa vào `StandardTable`.
- **CatalogTable.tsx**: Chỉ truyền `tableKey` vào `StandardTable` (dòng 428) và chịu chung số phận bị bỏ rơi.
- **Kết luận**: Tính năng nhớ ẩn/hiện và thứ tự cột hiện đang **bị đứt hoàn toàn** trên toàn hệ thống.

## 5. Nguồn dữ liệu của các đường xuất tệp

- **ui/table-export.ts**: Nhận danh sách cột trực tiếp từ tham số `cols` của hàm `buildCsv` (dòng 35).
- **TableExportDialog.tsx**: Nhận `visibleColumns` và `allColumns` từ props (dòng 29-31). `visibleColumns` thường là kết quả của `shownCols` từ bảng cha.
- **AllInOneExportPanel.tsx**: Dùng danh sách cột cố định từ mẫu template database (`allinone-template.ts`), không phụ thuộc vào giao diện bảng.
- **bao-cao/excel.ts**: Nhận danh sách cột từ cấu trúc `BaoCaoData` truyền vào (dòng 29).

---

## Đề xuất phương án (T6b)

### Phương án 1: Nối lại dây đứt (Khôi phục StandardTable)

Khôi phục khả năng persisted preferences cho `StandardTable`.

- **Cách làm**: Tích hợp `useColumnPrefs` vào `StandardTable.tsx`, thêm nút "Cài đặt cột" vào Toolbar để mở `ColumnSettingsDialog`.
- **Số file cần sửa**: ~4 file (`StandardTable.tsx`, `use-column-prefs.ts`, tạo mới `ColumnSettingsDialog.tsx`, và cập nhật `TableExportDialog.tsx` để đồng bộ thứ tự).

### Phương án 2: Xoá hẳn (Cleanup)

Chấp nhận bảng chỉ hiển thị cố định theo code và xoá bỏ các đoạn mã thừa.

- **Cách làm**: Xoá `tableKey` và các props liên quan khỏi `StandardTable` và 33 nơi gọi. Xoá file `use-column-prefs.ts`.
- **Số file cần sửa**: ~35 file (rất nhiều file route và component).

**Khuyến nghị**: Nên chọn **Phương án 1** vì hệ thống MIRATS 2.0 có rất nhiều cột, việc người dùng tùy chỉnh giao diện theo nhu cầu nghiệp vụ là tính năng quan trọng đã được đầu tư code backend (`bang_cot_tuy_chinh`).
