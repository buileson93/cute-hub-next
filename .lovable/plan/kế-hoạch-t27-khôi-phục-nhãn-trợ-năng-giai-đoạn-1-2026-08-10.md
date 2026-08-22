# Kế hoạch T27: Khôi phục nhãn trợ năng (Giai đoạn 1)

## Bối cảnh

Sau đợt tái cấu trúc (T26), số lượng `aria-label` giảm từ 173 xuống 159 (hồi quy trợ năng). Cần khôi phục nhãn cho các nút chỉ có icon để đảm bảo trải nghiệm cho người dùng dùng trình đọc màn hình.

## Giai đoạn 1: Đo lường và Phân loại

1. **Đếm lại**: Hiện tại có **159** `aria-label` (thiếu ít nhất 14 cái để đạt mốc 173).
2. **Liệt kê & Phân loại** (Danh sách sơ bộ các nút quan trọng thiếu nhãn):

### Nhóm 1: Thay đổi dữ liệu (Ưu tiên cao nhất)

- `src/components/mirats/ChungChiPanel.tsx`: Nút Xoá chứng chỉ (dòng 121 - Đã có aria-label nhưng cần kiểm tra tính đồng bộ).
- `src/components/mirats/ThietBiTepDinhKem.tsx`:
  - Nút Xoá ảnh (dòng 169 - Đã có).
  - Nút Xoá tài liệu (dòng 212 - Đã có).
- `src/routes/_app.danh-muc.model.tsx`: Nút Xoá model (dòng 361 - Thiếu nhãn, đang dùng title).
- `src/components/mirats/InlineField.tsx`: Nút Lưu/Huỷ (dòng 168, 178 - Đã có).
- `src/components/mirats/LyLichLayerPanel.tsx`: Nút Sửa ngày lắp (dòng 70 - Đã có).

### Nhóm 2: Điều hướng & Mở hộp thoại

- `src/routes/_app.danh-muc.model.tsx`:
  - Nút Sửa model (dòng 359 - Thiếu nhãn).
  - Nút Thông tin (dòng 357 - Thiếu nhãn).
- `src/components/mirats/NotificationBell.tsx`: Nút Đánh dấu đã đọc (dòng 107 - Đã có).

### Nhóm 3: Trang trí / Khác

- Các nút trong `StandardTable.tsx` (như nút phân trang) - Đã có nhãn.

## Giai đoạn 2: Thực hiện sửa đổi (Nhóm 1)

Tôi sẽ tiến hành thêm `aria-label` cho các nút thuộc Nhóm 1 (Thay đổi dữ liệu) mà chưa có nhãn.

### Các file sẽ được cập nhật trong lượt này:

1. `src/routes/_app.danh-muc.model.tsx`:
   - Thêm `aria-label="Thông tin mẫu"` cho nút Info.
   - Thêm `aria-label="Sửa mẫu"` cho nút Pencil.
   - Thêm `aria-label="Xoá mẫu"` cho nút Trash2.
2. `src/components/mirats/ThanhPhanTable.tsx`: (Kiểm tra và thêm nếu thiếu nhãn cho các nút hành động hàng loạt/inline).

## Kiểm tra sau khi thực hiện

- Chạy `npx tsc --noEmit`.
- Chạy `npm run test`.
- Đếm lại tổng số `aria-label`.

---

_Lưu ý: Tôi sẽ dừng lại sau khi sửa xong Nhóm 1 để báo cáo và chờ duyệt._
