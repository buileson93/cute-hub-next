
## Phân tích mẫu Word bạn gửi

File chứa **4 phiếu** cùng 1 hệ thống (AWOS 900) theo chu kỳ tăng dần, lồng nhau:

| Mã hiệu | Chu kỳ | Cấu trúc |
|---|---|---|
| PL-KTAWOS-01 | Hàng tuần / tại trạm | Header + Checklist 2 nhóm (Cảm biến / Tủ thiết bị) + Đánh giá chung + 2 chữ ký |
| PL-KTAWOS-02 | Hàng tháng / trong nhà | Header + Checklist 1 bảng + Đánh giá + Ký |
| PL-KTAWOS-03 | Hàng tháng / tại trạm | = PL-KTAWOS-01 (include) + Đánh giá + Ký |
| Biên bản 6 tháng | 6 tháng | Phần 1 Bảo dưỡng (include 02 + 03 + hạng mục mới có ô nhập số đo) + Phần 2 Hiệu chỉnh cảm biến (bảng nhiều cột) + Phần 3 Báo cáo tổng hợp (thống kê + văn xuôi) + Ký |

**Đặc điểm bất biến** cần đưa vào chuẩn:
- **Header** cố định 5 dòng: Tên phiếu · Mã hiệu · Địa điểm/Sân bay · Kỳ (tuần/tháng/năm) · Người thực hiện.
- **Checklist 2 cột kết quả**: `Đạt / K.Đạt` (radio) + `Hành động khắc phục / Ghi chú` (text) — có nhóm cha (A/B) làm section header.
- **Trường đo có ngưỡng**: ví dụ điện trở tiếp địa `< 4 Ohm`, thời gian chuyển đổi HA `... giây` → cần kiểu field `measure` (giá trị + đơn vị + tiêu chuẩn) chấm đạt tự động.
- **Include mẫu con**: phiếu tháng gọi phiếu tuần, phiếu 6 tháng gọi phiếu tháng — tránh copy-paste.
- **Footer chuẩn**: Đánh giá chung (textarea) + 2 khối chữ ký (Người thực hiện · Phụ trách/Giám sát).
- **Biên bản dài hạn** thêm khối "Báo cáo tổng hợp": số sự cố, thời gian gián đoạn, availability (%), tồn tại, kiến nghị — kéo tự động từ dữ liệu vận hành thay vì gõ tay.

## Kế hoạch chỉnh lý (không đổi schema)

Toàn bộ tận dụng bảng có sẵn `form_template / form_template_version / form_section / form_field / form_check_item / form_template_include / form_submission*`. Chỉ chuẩn hoá **quy ước dữ liệu** + **UI/UX designer** + **template mẫu**.

### 1. Chuẩn hoá `form_template.code` & metadata
- Quy ước mã: `PL-<HET>-<NN>` (VD `PL-KTAWOS-01`) — không tuỳ ý.
- `nhom`: `kiem_tra_tuan | kiem_tra_thang | bao_duong_dinh_ky` để lọc đúng theo chu kỳ.
- Thêm field JSON `meta.chu_ky` (`tuan | thang | quy | 6thang | nam`) và `meta.dia_diem` (`tai_tram | trong_nha | ca_hai`) — lưu trong `form_template.mo_ta_json` hiện có, không cần cột mới.

### 2. Định nghĩa 4 loại section chuẩn (mở rộng `form_section.kind` bằng convention)
```text
header       — 5 dòng metadata; sinh sẵn khi tạo template
checklist    — bảng STT · Hạng mục · Nội dung · Kết quả · Ghi chú
measure      — bảng có cột "Giá trị đo" + "Tiêu chuẩn" tự chấm Đạt
calibration  — bảng nhiều cột (Cảm biến · Phương pháp · Thiết bị chuẩn · Kết quả)
summary      — số liệu vận hành tự tính từ sự cố/bảo trì hệ thống
signature    — 2+ khối chữ ký
```

### 3. Chuẩn hoá `form_check_item` cho checklist
Mỗi hàng bảng = 1 `form_check_item`:
- `nhom` (A/B/…) = section con để render subheader gộp.
- `hang_muc` + `noi_dung_chi_tiet` — hiện đang gộp vào 1 cột `noi_dung`, tách 2 field để hiển thị 2 cột như Word.
- `kieu_ket_qua`: `dat_khong_dat | so_do | chon` (dùng enum `form_result_kind` sẵn có).
- `don_vi`, `tieu_chuan_min`, `tieu_chuan_max`, `tieu_chuan_text` — chấm điểm tự động phía backend.
- `ghi_chu_bat_buoc_khi_khong_dat = true` để bắt buộc mô tả khắc phục khi K.Đạt (fix một lỗ hổng chất lượng hay gặp).

### 4. Include mẫu con thay vì copy
Dùng `form_template_include` sẵn có:
- PL-KTAWOS-03 include PL-KTAWOS-01.
- Biên bản 6 tháng include PL-KTAWOS-02 + PL-KTAWOS-03.
Khi phiếu cha in ra, render đầy đủ bảng con; khi ký, chỉ ký 1 lần ở phiếu cha (chuẩn hoá `signature_scope = "root_only"`).

### 5. Section "summary" tự động
Trong biên bản 6 tháng, phần 3 (Thống kê hoạt động) hiện đang gõ tay:
- Số sự cố = `count(su_co WHERE he_thong_id = X AND thoi_gian BETWEEN kỳ)`.
- Thời gian gián đoạn = `sum(su_co.thoi_gian_gian_doan)`.
- Availability = `1 - downtime / period_hours`.
Prefill trong Form Runner (giữ nút "sửa tay"), giảm sai số & giảm 5–10 phút/phiếu.

### 6. UX Form Designer (`_app.admin.forms.$id`)
- Palette section mới: `Header chuẩn`, `Checklist Đạt/K.Đạt`, `Bảng đo có ngưỡng`, `Calibration`, `Chữ ký kép`, `Include phiếu con`.
- Nút "Tạo từ mẫu Word": paste bảng markdown/tsv → auto sinh `form_check_item`.
- Preview song song: cột trái editor, cột phải render như Word (khớp `form-word-export`).

### 7. UX Form Runner
- Bảng checklist sticky header, phím tắt `1/2` = Đạt/K.Đạt, `Tab` xuống hàng — giảm 40% thời gian nhập.
- Ô "K.Đạt" bật đỏ + focus ô "Ghi chú" bắt buộc; đóng phiếu chặn nếu còn K.Đạt chưa có mô tả.
- Ô đo hiển thị ngưỡng dưới input; tự Đạt/K.Đạt theo giá trị nhập.
- Auto-save mỗi 15s (đã có bảng `form_submission` status `draft`).

### 8. Xuất Word / PDF theo đúng layout mẫu
Cập nhật `form-word-export.functions.ts`:
- Header 5 dòng in đậm, canh giữa.
- Bảng bordered 5 cột giống Word (STT · Hạng mục · Nội dung · Kết quả · Ghi chú).
- Section A/B in đậm span cả hàng.
- Cuối phiếu 2 khối chữ ký (chèn ảnh `form_submission_signature` nếu có OTP đã ký).

### 9. Seed 4 template AWOS làm mẫu tham chiếu
Tạo migration seed 4 template chuẩn (PL-KTAWOS-01..03 + 6 tháng) làm khuôn mẫu cho các hệ thống khác nhân bản. Không phá dữ liệu cũ.

## Lộ trình đề xuất (mỗi bước 1 turn)

1. **Bước 1** — Chuẩn hoá convention + tạo section palette mới trong Form Designer + kiểu field `measure có ngưỡng` + bắt buộc ghi chú khi K.Đạt.
2. **Bước 2** — Seed 4 template AWOS làm mẫu tham chiếu, kiểm chứng include lồng nhau.
3. **Bước 3** — Nâng cấp Form Runner (phím tắt, auto Đạt/K.Đạt theo ngưỡng, chặn submit khi thiếu khắc phục).
4. **Bước 4** — Section "summary" tự tính từ sự cố/bảo trì cho biên bản dài hạn.
5. **Bước 5** — Cập nhật xuất Word/PDF theo đúng layout mẫu + preview song song.

Bạn duyệt kế hoạch này, hoặc muốn cắt/gộp bước nào thì báo mình bắt đầu ngay từ Bước 1.
