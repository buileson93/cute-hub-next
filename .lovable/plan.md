# Kế hoạch: Chiến dịch bảo dưỡng lớn (Đợt bảo dưỡng)

## Mục tiêu
Quản lý 2 đợt bảo dưỡng lớn/năm của Công ty QLB Miền Trung: Phòng KT khởi tạo danh mục hệ thống cho từng đơn vị → đơn vị bổ sung/điều chỉnh và cập nhật kết quả → tổng hợp thành báo cáo (dashboard + Word/PDF).

## Cấu trúc dữ liệu (backend)

Migration mới, tuân thủ đủ 4 bước GRANT + RLS + policy theo `has_role`/`get_user_don_vi_id`:

- `dot_bao_duong` — thông tin đợt
  - `ten`, `nam`, `ky` (1|2), `tu_ngay`, `den_ngay`, `mo_ta`, `trang_thai` (nhap, mo, dang_thuc_hien, dong, huy), `nguoi_tao`
- `dot_bao_duong_hang_muc` — 1 dòng = (đợt × đơn vị × hệ thống)
  - `dot_id`, `don_vi_id`, `he_thong_id`, `nguon` (kt_khoi_tao | don_vi_bo_sung), `bat_buoc` (bool), `ghi_chu_kt`
  - Kết quả tổng hợp: `trang_thai` (chua_bat_dau, dang_lam, hoan_thanh, khong_thuc_hien), `ket_qua` (dat|khong_dat|khac), `ton_tai`, `kien_nghi`, `nguoi_thuc_hien`, `ngay_hoan_thanh`
  - UNIQUE (`dot_id`, `he_thong_id`)
- `dot_bao_duong_bien_ban` — link biên bản: `hang_muc_id`, `form_submission_id`
- `dot_bao_duong_tep` — file đính kèm: `hang_muc_id`, `duong_dan`, `ten_goc`, `loai`, `nguoi_up`
- `dot_bao_duong_su_co` — link sự cố phát hiện: `hang_muc_id`, `su_co_id` (hoặc `hong_hoc_id`)

RPC:
- `dot_them_hang_muc_hang_loat(dot_id, don_vi_id, he_thong_ids[])` — Phòng KT thêm nhiều hệ thống một lúc.
- `dot_bao_cao_tong_hop(dot_id)` — trả JSON: tổng số, theo đơn vị (tổng/hoàn thành/đạt/không đạt), top tồn tại.

## Phân quyền

- Phòng KT (`phong_kt`, `admin`): tạo đợt, khởi tạo danh mục cho mọi đơn vị, mở/đóng đợt, xem tất cả.
- Phụ trách đơn vị / KTV (`phu_trach_dv`, `ktv`, `to_truong`): xem đợt, bổ sung hệ thống thuộc đơn vị mình, cập nhật kết quả, gắn biên bản/file/sự cố.
- Readonly: chỉ xem.

## UI / luồng người dùng

Route mới:
- `/_app/bao-duong/dot` — danh sách đợt (badge trạng thái, tiến độ %).
- `/_app/bao-duong/dot/new` — form tạo đợt (Phòng KT).
- `/_app/bao-duong/dot/$id` — trang chi tiết đợt gồm:
  - Header: tên đợt, kỳ, khoảng thời gian, trạng thái, KPI tiến độ.
  - Tab **Danh mục**: bảng nhóm theo đơn vị, mỗi dòng là (hệ thống × đơn vị) với nguồn (KT/Đơn vị), bắt buộc, trạng thái, kết quả. Có: multi-select add hệ thống (KT), nút "Thêm hệ thống" (đơn vị – chỉ hệ thống của đơn vị mình).
  - Tab **Kết quả**: click vào 1 hàng mở panel bên phải để cập nhật ket_qua/ton_tai/kien_nghi, gắn biên bản (chọn từ `form_submission` của hệ thống), upload file, link sự cố.
  - Tab **Báo cáo**: dashboard tổng hợp (tỷ lệ hoàn thành theo đơn vị – bar chart; tỷ lệ Đạt/K.Đạt – donut; top hệ thống có tồn tại), nút "Xuất Word/PDF".
- Sidebar: thêm mục "Đợt bảo dưỡng" trong nhóm Bảo dưỡng.

## Xuất Word/PDF

Xuất Word `.docx` theo layout công ty dùng `docx` npm; xuất PDF dùng `print` browser (CSS `@media print`) cho tab Báo cáo. Cấu trúc báo cáo:
1. Trang bìa: tên đợt, kỳ, năm, ngày ban hành.
2. Phần I: Danh mục hệ thống bảo dưỡng theo đơn vị.
3. Phần II: Kết quả thực hiện (bảng đánh giá Đạt/K.Đạt, tồn tại, kiến nghị).
4. Phần III: Phụ lục biên bản đã thực hiện + sự cố phát hiện.

## Kỹ thuật

- Server functions trong `src/lib/mirats/dot-bao-duong.functions.ts` (list/get/create/updateHangMuc/addHangMucBulk/report/export) dùng `requireSupabaseAuth`.
- File upload: bucket Storage `dot-bao-duong` với RLS theo đơn vị.
- Realtime: subscribe kênh `dot_bao_duong_hang_muc` filter theo `dot_id` để KT thấy đơn vị cập nhật ngay.
- Export Word: server function trả ArrayBuffer bằng `docx`, client tải xuống.

## Các bước triển khai

1. Migration schema + GRANT + RLS + RPC.
2. Server functions + storage bucket.
3. Route danh sách + tạo đợt.
4. Route chi tiết: tab Danh mục (thêm hàng loạt, thêm bổ sung).
5. Tab Kết quả: panel cập nhật, gắn biên bản/file/sự cố.
6. Tab Báo cáo: dashboard + xuất Word/PDF.
7. Sidebar + realtime + verify grants + smoke test Playwright (tạo đợt → KT add hệ thống → đơn vị cập nhật kết quả → xuất báo cáo).
