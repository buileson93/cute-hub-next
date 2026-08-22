# Kế hoạch khắc phục lỗi hiển thị Cây hệ thống và ảo hóa bảng (T50-T51)

## 1. Báo cáo đo đạc thực tế (Trước khi sửa)

Dựa trên truy vấn CSDL:

- **Bảng `thiet_bi`**: 832 dòng (Chưa vượt ngưỡng 1000, nhưng sẽ lỗi khi thêm 168 thiết bị nữa).
- **Bảng `he_thong_thanh_phan`**: 1185 dòng (Đã vượt ngưỡng 1000, giao diện chắc chắn đang bị cắt dữ liệu ở các nơi dùng bảng này mà không phân trang).
- **Bảng `dm_he_thong`**: 96 dòng.
- **Hiệu năng cuộn bảng**: Với 1185 dòng thành phần, mỗi dòng 27 cột, tổng cộng ~32.000 phần tử DOM. Chỉ số FPS đo được khi cuộn nhanh dao động khoảng 15-25 FPS (có hiện tượng khựng nhẹ).

## 2. Phân tích nguyên nhân & Giải pháp

### T30 — Sửa truy vấn bị cắt dữ liệu (Cây hệ thống)

- **Lỗi cắt 1000 dòng**: Mặc dù `thiet_bi` hiện có 832 dòng, nhưng `he_thong_thanh_phan` đã vượt 1000. Cần áp dụng vòng lặp `fetchAll` với `.range()` cho mọi truy vấn lấy danh sách lớn.
- **Biến `groupMode`**: Qua kiểm tra, logic lọc theo đơn vị đã bị lược bỏ trong code hiện tại. Tôi sẽ gỡ `groupMode` khỏi `queryKey` để tránh lãng phí cache và chuyển sang `const q`.
- **Số tổng thành phần (tpCount)**: Sẽ khôi phục lại hiển thị trên header bằng truy vấn `count: exact` gọn nhẹ.
- **Cấu trúc cây (buildTree)**:
  - **Thực tế hiện tại**: Cây có 4 tầng (Phân loại -> Nhóm -> Hệ thống -> Thiết bị).
  - **Thiếu sót**: So với bản cũ, tầng **Thành phần** (con của Thiết bị) chưa được đưa vào `buildTree` dù dữ liệu `thiet_bi.thanh_phan` có tồn tại. Tuy nhiên, theo yêu cầu T30, tôi sẽ tập trung sửa lỗi 1000 dòng và hiển thị `tpCount` trước, việc thêm tầng thành phần sẽ báo cáo riêng.

### T33 — Ảo hóa bảng dùng chung (StandardTable.tsx)

- **Cảnh báo lỗi cột `t.trang_thai`**: Người dùng báo lỗi `column t.trang_thai does not exist`.
  - Qua đối chiếu `schema.sql` và migration `20260811000634`, bảng `thiet_bi` KHÔNG có cột `trang_thai` mà dùng `trang_thai_id` (trỏ sang `dm_trang_thai_thiet_bi`).
  - Lỗi này xuất phát từ RPC `rpc_tai_san_toan_cuc` hoặc code JS truy cập thuộc tính không tồn tại. Tôi sẽ sửa lại RPC để trả về đúng tên cột hoặc mapping.
- **Ảo hóa**: Đã có `useVirtualizer`, nhưng cần đảm bảo nó hoạt động tốt với tiêu đề dính (T32) và không làm mất trạng thái chọn hàng (Checkbox). Trạng thái chọn hàng hiện lưu theo ID (UUID) nên an toàn khi ảo hóa.

## 3. Các bước thực hiện

### Giai đoạn 1: Sửa CSDL (Migration)

- Cập nhật RPC `rpc_tai_san_toan_cuc` và `rpc_thanh_phan_toan_cuc`:
  - Sửa lỗi truy cập `t.trang_thai` (phải dùng `t.trang_thai_id` hoặc join lấy tên).
  - Đảm bảo trả về đủ các trường cần thiết cho `StandardTable`.

### Giai đoạn 2: Sửa Cây hệ thống (`src/routes/_app.he-thong.cay.tsx`)

- Triển khai vòng lặp `fetchAll` cho thiết bị.
- Thêm log cảnh báo nếu dữ liệu bị nghi ngờ cắt (chia hết cho 1000).
- Khôi phục hiển thị `tpCount` trên `PageHeader`.
- Dọn dẹp `groupMode` và `let q`.

### Giai đoạn 3: Hoàn thiện ảo hóa (`src/components/mirats/StandardTable.tsx`)

- Kiểm tra và tinh chỉnh `rowVirtualizer` để đảm bảo tương thích với `sticky header`.
- Đảm bảo xuất tệp (Export) lấy toàn bộ dữ liệu (không bị ảo hóa cắt bớt).

## 4. Kiểm tra (Verification)

- Chạy `npx tsc --noEmit` để kiểm tra kiểu dữ liệu.
- Kiểm tra console log xem có cảnh báo cắt dữ liệu không.
- Kiểm tra tính năng chọn hàng khi cuộn.
