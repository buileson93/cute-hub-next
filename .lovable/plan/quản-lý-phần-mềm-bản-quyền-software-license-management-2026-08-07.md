# Quản lý phần mềm bản quyền (Software License Management)

Mục tiêu: theo dõi giấy phép phần mềm (OS, Office, SCADA/AWOS client, antivirus, CAD, phần mềm chuyên dụng…) gắn với các tài sản CNTT (máy tính, server, laptop, thiết bị có máy tính nhúng). Không thay đổi UI hiện có — chỉ bổ sung dữ liệu, logic và màn hình mới độc lập.

## Phạm vi nghiệp vụ

- Một **bản quyền phần mềm** có: tên phần mềm, nhà cung cấp/nhà phát hành, phiên bản, loại bản quyền (vĩnh viễn / thuê bao / OEM / volume / open-source), số key/serial, số ghế (seats) tổng, ngày mua, ngày bắt đầu, ngày hết hạn, giá trị, số hợp đồng/hóa đơn, đơn vị sở hữu, ghi chú, tệp đính kèm (PDF hợp đồng/chứng chỉ).
- Một bản quyền **cấp phát (assign)** cho nhiều tài sản máy tính; mỗi lần cấp phát ghi: tài sản, ngày cài đặt, người cài, ngày thu hồi, trạng thái.
- **Số ghế còn lại** = tổng seats − số cấp phát đang hiệu lực; chặn cấp vượt seats (trừ loại unlimited).
- **Cảnh báo**: sắp hết hạn (mặc định 60/30/7 ngày), hết ghế, key trùng, tài sản CNTT chưa có OS/antivirus hợp lệ.

## Dữ liệu (migration mới)

1. `dm_loai_ban_quyen` — danh mục loại bản quyền (vinh_vien, thue_bao, oem, volume, open_source, dung_thu).
2. `phan_mem_ban_quyen` — bản ghi bản quyền (các trường ở trên; `so_ghe int null` = không giới hạn; `don_vi_id` FK `dm_don_vi`; `nha_cung_cap_id` FK `dm_nha_cung_cap`; mã tự sinh `BQ_XXXXXXXX`).
3. `phan_mem_ban_quyen_cap_phat` — cấp phát tới `thiet_bi` (unique một tài sản/một bản quyền khi còn hiệu lực).
4. `phan_mem_ban_quyen_tep` — tệp đính kèm (dùng lại adapter lưu trữ R2/Cloud hiện có).
5. Trigger kiểm tra vượt seats, trigger `updated_at`, RLS + GRANT theo đúng chuẩn dự án (đọc theo đơn vị, ghi theo quyền quản lý thiết bị, admin toàn quyền).
6. RPC `ban_quyen_tong_hop()` — thống kê: sắp hết hạn, ghế đã dùng/còn, chi phí theo đơn vị.

## Nhận diện “tài sản liên quan máy tính”

Không sửa dữ liệu tài sản: nhận diện bằng cờ trên danh mục chủng loại — thêm cột `la_may_tinh boolean default false` cho `dm_loai_thiet_bi`, admin đánh dấu các chủng loại (PC, laptop, server, workstation, industrial PC). Danh sách chọn tài sản khi cấp phát lọc theo cờ này (vẫn cho phép bỏ lọc).

## Màn hình mới (không đụng UI cũ)

- `/phan-mem-ban-quyen` — danh sách dùng `StandardTable` sẵn có: phần mềm, loại, seats dùng/tổng, hết hạn (badge màu), đơn vị, đính kèm.
- `/phan-mem-ban-quyen/$ma` — chi tiết: thông tin bản quyền, tab Cấp phát (thêm/thu hồi), tab Tệp (DocViewerDialog sẵn có), tab Lịch sử.
- Dialog thêm/sửa dùng `SchemaDialog`; chọn tài sản dùng `Combobox`.
- Thêm 1 mục menu trong nhóm Danh mục/Tài sản của sidebar (chỉ thêm entry, không đổi layout).

## Cảnh báo & tích hợp

- Nối vào cơ chế cảnh báo hết hạn hiện có (`canh_bao_het_han_log` + email/Telegram) với nguồn mới `phan_mem_ban_quyen`.
- Thẻ “Bản quyền sắp hết hạn” chỉ hiện trong trang mới, không sửa dashboard.

## Kỹ thuật

- Logic thuần trong `src/lib/mirats/ban-quyen.ts` (tính seats, trạng thái hết hạn) + unit test vitest.
- Truy vấn qua client Supabase hiện có; tệp qua `src/lib/storage`.
- Quyền: module `ban_quyen` trong `role_permission`, dùng `PermGate` cho nút ghi, `use-can-download` cho tệp.

## Ngoài phạm vi

- Không quét/khám phá phần mềm cài đặt tự động trên máy trạm.
- Không thay đổi bất kỳ màn hình hiện có nào.
