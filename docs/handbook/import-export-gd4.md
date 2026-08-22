# Nhập/Xuất hàng loạt — GĐ4: Trải nghiệm & Tài liệu

Trạng thái: DONE. Chuẩn hoá dòng chảy XEM TRƯỚC dạng bảng cho **mọi**
nút "Nhập CSV" trong ứng dụng, bao gồm cả các nút rải rác ở danh mục
nền (Nhà sản xuất, Nhà cung cấp, Chủng loại, Model…).

## 1. Bốn cột mốc của một phiên nhập

```text
Chọn file → parseCsv → engine.preview()  → ImportPreviewDialog
                                     ↓  (badge Tạo/Cập nhật/Lỗi/Bỏ qua)
                              người dùng bấm "Ghi vào CSDL"
                                     ↓
                              engine.commit() → invalidate cache
```

- Không có bước nào ghi thẳng vào DB trước khi người dùng xác nhận.
- Có dòng lỗi → nút "Ghi vào CSDL" **tự khoá**. Sửa file, tải lại.
- Cảnh báo (warning) là mềm — vẫn cho ghi nhưng đánh dấu vàng.

## 2. Hợp đồng UI

`ImportPreviewDialog` (src/components/mirats/ImportPreviewDialog.tsx)
nhận thêm `statuses?: ImportPreviewRowStatus[]`. Khi truyền vào:

- Header hiện tổng: `+N tạo`, `~N cập nhật`, `N lỗi`.
- Mỗi dòng có badge hành động và nền đỏ nhạt (lỗi) / vàng nhạt (cảnh báo).
- Nút "Ghi vào CSDL" bị vô hiệu khi `errorCount > 0`.
- Backward-compat: callers cũ không truyền `statuses` vẫn chạy như trước.

## 3. Điểm chạm đã nối `engine.preview()`

| Vị trí                                         | File                                        | Trạng thái |
| ---------------------------------------------- | ------------------------------------------- | ---------- |
| Admin Import Studio (all-in-one)               | `src/routes/_app.admin.nhap-lieu.tsx`       | ✅ có sẵn  |
| Danh mục nền dùng chung (NCC, Loại TB, Model…) | `src/components/mirats/CatalogTools.tsx`    | ✅ GĐ4     |
| Nhà sản xuất                                   | `src/components/mirats/NhaSanXuatTools.tsx` | ✅ GĐ4     |

Bật/tắt qua feature flag `importEngineUnified` (xem
`src/lib/mirats/feature-flags.ts`). Khi tắt: fallback về upsert
client như cũ, không có badge — an toàn để rollback.

## 4. Lô nhập & Lịch sử

- `ImportBatchDetail` (GĐ2) hiển thị diff **Trước → Sau**, lọc theo
  action/status, tải CSV các dòng lỗi.
- Mọi ghi thật đi qua `runBulkImport` → tự sinh `import_batch` +
  `import_item`, có thể **Hoàn tác cả lô** từ trang lịch sử.

## 5. Kiểm thử & tuyến hồi quy

- `src/components/mirats/__tests__/ImportPreviewDialog.test.tsx`
  bao trạng thái + khoá nút khi có lỗi.
- `src/lib/mirats/__tests__/import-csv.test.ts` bao parse + engine.
- QA thủ công: đăng nhập admin, tại `/danh-muc/nha-san-xuat` bấm
  **Nhập CSV** với 1 file cố tình sai `ten` rỗng → thấy badge "Lỗi",
  nút Ghi bị khoá; sửa file, tải lại → thấy `+N tạo` và ghi thành công.

## 6. Việc còn để mở

- Xuất mẫu Excel có drop-down cho các trường FK theo tên (đã có ở
  all-in-one, chưa lan sang các nút danh mục rải rác — cần bổ sung
  đường xuất `.xlsx` bên cạnh CSV hiện có ở `CatalogTools`).

## 7. Cập nhật GĐ4.1 — refConfirm inline

Trong `AllInOneImport`, dải cảnh báo "nhóm nền chưa có" giờ có
checkbox **"Cho phép tự tạo N nhóm nền còn thiếu khi ghi"** ngay
trong banner. Bật ô → hệ thống tự chạy lại `checkAll(true)` để badge
"Danh mục sẽ tạo" cập nhật, không cần bước xác nhận rời.
