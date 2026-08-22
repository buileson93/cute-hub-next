# Cấp phát phần mềm ngay khi thêm bản quyền mới

Hiện nay khi thêm một bản quyền mới, người dùng phải lưu xong, tìm lại dòng đó trong danh sách rồi mới mở dialog cấp phát. Kế hoạch này gộp bước cấp phát vào ngay luồng tạo mới.

## Trải nghiệm mới

1. Trong form "Thêm bản quyền", bổ sung khối cuối form: **Cấp phát ngay (tuỳ chọn)**
   - Chọn nhiều máy tính (tài sản `la_may_tinh`) bằng ô tìm kiếm nhiều lựa chọn.

   - Ngày cài đặt (mặc định hôm nay), người cài (mặc định tài khoản đang đăng nhập), ghi chú.

   - Cảnh báo trực tiếp nếu số máy chọn vượt quá "Số ghế" đã khai; nút lưu bị chặn cho tới khi giảm số máy hoặc tăng số ghế.

2. Bấm **Lưu**: hệ thống tạo bản quyền, rồi tạo các bản ghi cấp phát tương ứng và ghi nhật ký kiểm toán cho từng máy.

3. Thông báo kết quả: "Đã tạo bản quyền X và cấp phát cho N máy". Nếu một phần cấp phát lỗi (hết ghế do người khác vừa cấp), bản quyền vẫn được giữ và báo rõ máy nào chưa cấp được.

4. Ở chế độ **Sửa**, khối này ẩn đi — cấp phát/thu hồi vẫn dùng màn hình cấp phát chuyên biệt như hiện tại.

## Chi tiết kỹ thuật

- `src/components/mirats/BanQuyenFormDialog.tsx`: thêm state danh sách thiết bị chọn khi `mode === "create"`, render thành một khối riêng bên dưới các trường của `SchemaDialog`.

- Nguồn thiết bị: truy vấn `thiet_bi` lọc `la_may_tinh = true`, tìm kiếm phía máy chủ theo `ma_thiet_bi`/`ten_thiet_bi` (dùng lại pattern `Combobox` có `onSearchChange` như trong `BanQuyenCapPhatDialog.tsx`), giới hạn 20 kết quả.

- Sau khi `insert` vào `phan_mem_ban_quyen` với `.select("id, ma_ban_quyen").single()`, chèn mảng bản ghi `phan_mem_ban_quyen_cap_phat` (`ban_quyen_id`, `thiet_bi_id`, `ngay_cai_dat`, `nguoi_cai`, `ghi_chu`). Ràng buộc số ghế phía CSDL (`pmbq_check_seats` có khoá dòng) vẫn là chốt chặn cuối.

- Ghi log bằng `logBanQuyenAudit(bqId, "ASSIGN", ...)` cho mỗi máy, đồng bộ với luồng cấp phát hiện có.

- Làm mới cache: `ban_quyen`, `ban_quyen_detail`, `["ban_quyen", "cap-phat-list-unified"]`.

- Không thay đổi lược đồ CSDL, không thêm bảng mới.
